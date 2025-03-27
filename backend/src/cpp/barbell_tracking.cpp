#include <opencv2/opencv.hpp>
#include <opencv2/tracking.hpp>
#include <opencv2/video/tracking.hpp>
#include <opencv2/core/ocl.hpp>
#include <iostream>
#include <vector>
#include <sstream>
#include "raylib.h"
#include "tracker.hpp"
#include "structs.hpp"
#include "arc.hpp"
#include "dist.hpp"
#include "preprocess.hpp"
#include <unordered_map>
#include <algorithm>
#include <cstdio>
#include <cstring>

const int NOT_FOUND = 0xfffffff;
const int CANVAS_PADDING = 10;


struct prepaired_points {
    std::vector<frame_point> descent_points;
    std::vector<frame_point> ascent_points;
    frame_point min_y;
    frame_point max_y;
    frame_point min_x;
    frame_point max_x;
};

prepaired_points prepare_points(std::vector<frame_point> center_points) {
    std::vector<frame_point> descent_points, ascent_points;
    
    frame_point max_y = center_points[0], min_y = center_points[0], min_x = center_points[0], max_x = center_points[0];

    for (const auto& point : center_points) {
        if (point.y > max_y.y) max_y = point;
        if (point.x > max_x.x) max_x = point;
        if (point.x < min_x.x) min_x = point;
        if (point.y < min_y.y) min_y = point;
    }
       
    for (const auto &point : center_points) {
        if (point.frame_idx <= max_y.frame_idx) {
            descent_points.push_back(point);
        } else {
            ascent_points.push_back(point);
        }
    }

    frame_point ascent_min_y = ascent_points[0];

    auto it = min_element(ascent_points.begin(), ascent_points.end(),
        [](const frame_point &a, const frame_point &b) { return a.y < b.y; });

    if(it != center_points.end()) {
        ascent_min_y = *it;
    }

    std::vector<frame_point> filtered_ascent_points;
    for (const auto &point : ascent_points) {
        filtered_ascent_points.push_back(point);
        if (point.frame_idx >= ascent_min_y.frame_idx) {
            break;
        }
    }

    return prepaired_points {
        .descent_points = descent_points,
        .ascent_points = filtered_ascent_points,
        .min_y = min_y,
        .max_y = max_y,
        .min_x = min_x,
        .max_x = max_x
    };
}


void drawArcTextures(std::vector<arc> arcs, lineline line, RenderTexture2D arc_ascent_texture, RenderTexture2D arc_descent_texture, double scalor) {
    BeginTextureMode(arc_ascent_texture);
    ClearBackground(BLANK);
    drawArc(arcs[0], scalor, {0x00, 0x83, 0x47, 0xFF});
    drawArc(arcs[1], scalor, {0x00, 0x83, 0x47, 0xFF});
    drawLine(line, {0x00, 0x83, 0x47, 0xFF});
    EndTextureMode();

    BeginTextureMode(arc_descent_texture);
    ClearBackground(BLANK);
    drawArc(arcs[2], scalor, {0x83, 0x22, 0x1C, 0xFF});
    EndTextureMode();
}

std::vector<double> get_averages(std::vector<arc> arcs, lineline line, int canvas_size, std::vector<distance_info> descent_distances, std::vector<distance_info> ascent_distances, std::vector<std::pair<int,int>> start_and_end) {
    std::vector<double> ascent_start_distances = poach(ascent_distances, arcs[0], canvas_size);
    std::vector<double> ascent_middle_distances = poach(ascent_distances, arcs[1], canvas_size);
    std::vector<double> ascent_end_distances  = poach(ascent_distances, line, canvas_size);

    std::vector<double> descent_end_distances = poach(descent_distances, start_and_end[0].first, start_and_end[0].second, canvas_size);
    std::vector<double> descent_middle_distances = poach(descent_distances, start_and_end[1].first, start_and_end[2].second, canvas_size);
    std::vector<double> descent_start_distances  = poach(descent_distances, start_and_end[2].first, start_and_end[2].second, canvas_size);

    double ascent_start = filtered_mean(descent_start_distances);    
    double ascent_middle = filtered_mean(descent_middle_distances);   
    double ascent_end = filtered_mean(descent_end_distances);    
    double descent_start = filtered_mean(ascent_start_distances);    
    double descent_middle = filtered_mean(ascent_middle_distances); 
    double descent_end = filtered_mean(ascent_end_distances);

    return {ascent_start, ascent_middle, ascent_end, descent_start, descent_middle, descent_end};
}

void RenderVideo(int window_size, cv::VideoCapture &cap, ProcessedVideo &result, std::vector<arc> &arcs, const lineline &line, double scalor, std::vector<frame_point> &descent_points, int pos_x, int pos_y, std::vector<frame_point> &filtered_rise_points, int &canvas_size, cv::Mat &opencvFrame, bool flipped);


ProcessedVideo process_bar_path(const char* input_path, const char* output_path, int b_x, int b_y, int b_width, int b_height) {

    const static ProcessedVideo failed = {
        .succeeded = false,
        .averages = {0},
        .new_path = "Failed",
    };

    ProcessedVideo result = {
        .succeeded = true,
        .averages = {0},
        .new_path = {0},
    };


    int size = strlen(output_path);
    strncpy(result.new_path, output_path, 255);
    result.new_path[size] = 0;

    cv::VideoCapture cap(input_path);
    if (!cap.isOpened()) {
        std::cout << "Error: Could not open video." << std::endl;
        return failed;
    }

    cv::Rect bbox = {b_x, b_y, b_width, b_height};
    cap.set(cv::CAP_PROP_POS_FRAMES, 0);
    std::vector<frame_point> center_points = process_video(cap, bbox);

    prepaired_points pp = prepare_points(center_points);
    std::vector<frame_point> descent_points = pp.descent_points;
    std::vector<frame_point> filtered_rise_points = pp.ascent_points;
    int min_y = pp.min_y.y;
    int max_y = pp.max_y.y;
    int max_y_x = pp.max_y.x;
    int max_x = pp.max_x.x;
    int min_x = pp.min_x.x;

    cap.set(cv::CAP_PROP_POS_FRAMES, 0);
    cv::Mat opencvFrame;
    cap >> opencvFrame;
    if (opencvFrame.empty())
    {
        std::cerr << "Error: Could not read frame from video capture." << std::endl;
        cap.release();
        return failed;
    }

    cv::Mat rgbaFrame;
    cvtColor(opencvFrame, rgbaFrame, cv::COLOR_BGR2RGBA);
    if (!rgbaFrame.isContinuous())
        rgbaFrame = rgbaFrame.clone();

    int screenWidth = rgbaFrame.cols, screenHeight = rgbaFrame.rows;

    int canvas_size = max_y - min_y;
    int pos_y = min_y;
    int centre_pos_x = max_y_x;
    int pos_x = centre_pos_x;
    double scalor = canvas_size / 27.0;

    if (canvas_size % 2 != 0) {
        canvas_size += 1;
    }

    int window_size = canvas_size + CANVAS_PADDING * 2;

    int width = pp.max_x.x - pp.min_x.x;

    if(canvas_size > width*1.75 || width > canvas_size * 1.75 || width < 30 || canvas_size < 30) {
        std::cerr << "Error: Failed to find barbell" << std::endl;
        cap.release();
        return failed;
    }


    std::vector<point> bench_path_points = {
        {0, 0},
        {6, 9},
        {13, 15},
        {14.5, 16},
        {15, 17},
        {15, 28},
        {0, 0},
        {4, 16},
        {13, 27}
    };

    for (point& _p : bench_path_points) {
        _p.x *= scalor;
        _p.y *= scalor;
    }

    std::vector<arc> arcs = {
        arc_from_points(bench_path_points[0], bench_path_points[1], bench_path_points[2]),
        arc_from_points(bench_path_points[2], bench_path_points[3], bench_path_points[4]),
        arc_from_points(bench_path_points[6], bench_path_points[7], bench_path_points[8]),
    }; 

    lineline line = line_from_points(bench_path_points[4], bench_path_points[5]);
    
    bool flipped = descent_points[0].x < descent_points[descent_points.size()-1].x;

    for (auto &point : descent_points)
    {
        point.x = screenWidth - point.x;
    }
    for (auto &point : filtered_rise_points)
    {
        point.x = screenWidth - point.x;
    }
    
    RenderVideo(window_size, cap, result, arcs, line, scalor, descent_points, pos_x, pos_y, filtered_rise_points, canvas_size, opencvFrame, flipped);

    cap.release();

    return result;

}

void RenderVideo(int window_size, cv::VideoCapture &cap, ProcessedVideo &result, std::vector<arc> &arcs, const lineline &line, double scalor, std::vector<frame_point> &descent_points, int pos_x, int pos_y, std::vector<frame_point> &filtered_rise_points, int &canvas_size, cv::Mat &opencvFrame, bool flipped)
{
    SetConfigFlags(FLAG_WINDOW_HIDDEN);
    InitWindow(window_size, window_size, "OpenCV + Raylib Integration");

    int frame_idx = 0;

    int video_fps = cap.get(cv::CAP_PROP_FPS);

    std::stringstream ffmpeg_ss;
    ffmpeg_ss << "ffmpeg -y -f rawvideo -pixel_format rgba -video_size "
              << window_size << "x" << window_size
              << " -r " << video_fps << " -i - -c:v libx264 "<< (flipped ? "-vf hflip" : "") <<" -preset fast -pix_fmt yuv420p " << result.new_path;
    FILE *ffmpeg = popen(ffmpeg_ss.str().c_str(), "w");

    RenderTexture2D arc_descent_texture = LoadRenderTexture(window_size, window_size);
    RenderTexture2D arc_ascent_texture = LoadRenderTexture(window_size, window_size);

    drawArcTextures(arcs, line, arc_ascent_texture, arc_descent_texture, scalor);

    RenderTexture2D target = LoadRenderTexture(window_size, window_size);
    RenderTexture2D bar_path_texture = LoadRenderTexture(window_size, window_size);
    RenderTexture2D record_texture = LoadRenderTexture(window_size, window_size);

    std::vector<distance_info> descent_distances = get_texture_distance(arc_descent_texture, descent_points, pos_x, pos_y);
    std::vector<distance_info> ascent_distances = get_texture_distance(arc_ascent_texture, filtered_rise_points, pos_x, pos_y);
    std::vector<std::pair<int, int>> start_and_end = split_into_three(arcs[2].min_y, arcs[2].max_y);

    std::vector<double> averages = get_averages(arcs, line, canvas_size, descent_distances, ascent_distances, start_and_end);

    for (size_t i = 0; i < 6 && i < averages.size(); i++)
    {
        result.averages[i] = averages[i];
    }

    bool recording = true;

    std::unordered_map<int, rendered_point> current_point;
    for (const frame_point &fp : descent_points)
    {
        current_point.insert({fp.frame_idx, rendered_point{fp.x - pos_x, fp.y - pos_y, false}});
    }
    for (const frame_point &fp : filtered_rise_points)
    {
        current_point.insert({fp.frame_idx, rendered_point{fp.x - pos_x, fp.y - pos_y, true}});
    }

    bool was_ascending = false;
    bool has_started = false;
    canvas_size = window_size;

    while (!WindowShouldClose() && recording)
    {
        if (IsKeyPressed(KEY_Q))
        {
            break;
        }

        cap >> opencvFrame;
        if (opencvFrame.empty())
        {
            frame_idx = 0;
            cap.set(cv::CAP_PROP_POS_FRAMES, 0);
            cap >> opencvFrame;
            if (recording)
            {
                recording = false;
                pclose(ffmpeg);
            }
        }


        rendered_point rp = {-1, -1, false};
        bool got_rp = false;
        auto it = current_point.find(frame_idx);
        if (it != current_point.end())
        {
            rendered_point found_rp = it->second;
            if (!(found_rp.x < 0 || found_rp.y < 0 || found_rp.x > canvas_size))
            {
                rp = found_rp;
                got_rp = true;
            }
        }

        if (recording && got_rp)
        {
            EndTextureMode();
            BeginTextureMode(bar_path_texture);
            DrawCircle(rp.x, rp.y, scalor / 3, rp.acsent ? (Color){0x00, 0xFF, 0x89, 0xFF} : (Color){0xFF, 0x3B, 0x2F, 0xFF});
            EndTextureMode();
            BeginTextureMode(target);
        }

        if (got_rp && !rp.acsent)
        {
            DrawTextureRec(arc_descent_texture.texture, {0, 0, (float)canvas_size, (float)(rp.y)}, {0, 0}, WHITE);
            has_started = true;
        }
        else if (got_rp || has_started)
        {
            DrawTexture(arc_descent_texture.texture, 0, 0, WHITE);
        }

        if (got_rp && rp.acsent)
        {
            BeginScissorMode(0, rp.y - scalor / 2, canvas_size, canvas_size - rp.y + scalor / 2);
            DrawTexture(arc_ascent_texture.texture, 0, 0, WHITE);
            EndScissorMode();
            was_ascending = true;
        }
        else if (!got_rp && was_ascending)
        {
            DrawTexture(arc_ascent_texture.texture, 0, 0, WHITE);
        }

        DrawTextureRec(bar_path_texture.texture, {0, 0, (float)canvas_size, -(float)canvas_size}, {0, 0}, WHITE);
        EndTextureMode();

        BeginDrawing();
        DrawTextureRec(target.texture,
                       {0, 0, (float)window_size, -(float)window_size},
                       {(float)0, (float)0}, WHITE);
        EndDrawing();

        BeginTextureMode(record_texture);
        DrawTextureRec(target.texture,
                       {0, 0, (float)window_size, -(float)window_size},
                       {(float)0, (float)0}, WHITE);
        EndTextureMode();

        if (recording)
        {
            Image record_img = LoadImageFromTexture(record_texture.texture);
            ImageFlipVertical(&record_img);
            fwrite(record_img.data, 1, window_size * window_size * 4, ffmpeg);
            UnloadImage(record_img);
        }
        frame_idx++;
    }

    UnloadRenderTexture(arc_descent_texture);
    UnloadRenderTexture(arc_ascent_texture);
    UnloadRenderTexture(target);
    UnloadRenderTexture(bar_path_texture);
    UnloadRenderTexture(record_texture);
    CloseWindow();
}
