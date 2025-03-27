#include "dist.hpp"

const int NOT_FOUND = 0xfffffff;

int dist(Image image, int x, int y) {
    if (y < 0 || y >= image.height) {
        return NOT_FOUND;
    }

    int width = image.width;
    Color *pixels = (Color *)image.data;
    
    int d = 0;
    while ((x - d >= 0) || (x + d < width)) {
        if (x - d >= 0) {
            Color pixel = pixels[y * width + (x - d)];
            if (pixel.r != 0 || pixel.g != 0 || pixel.b != 0 || pixel.a != 0) {
                return -d;
            }
        }
        if (x + d < width) {
            Color pixel = pixels[y * width + (x + d)];
            if (pixel.r != 0 || pixel.g != 0 || pixel.b != 0 || pixel.a != 0) {
                return d;
            }
        }
        d++;
    }
    return NOT_FOUND;
}

std::vector<distance_info> get_texture_distance(RenderTexture2D texture, std::vector<frame_point> points, int cx, int cy) {
    Image image = LoadImageFromTexture(texture.texture);

    std::vector<distance_info> distances;
    for (const frame_point& fp : points) {
        frame_point fp2 = fp;
        fp2.x -= cx;
        fp2.y -= cy;

        if (fp2.x < 0 || fp2.x >= image.width || fp2.y < 0 || fp2.y >= image.height) {
            distances.push_back(distance_info{fp2, NOT_FOUND});
        } else {
            distances.push_back(distance_info{fp2, dist(image, fp2.x, fp2.y)});
        }
    }
    UnloadImage(image);
    return distances;
}

std::vector<double> poach(std::vector<distance_info> distances, int min_y, int max_y, int canvas_size) {

    std::vector<double> output;
    
    for (const distance_info& distance : distances)
    {
        if(distance.distance == NOT_FOUND) continue;

        int y = canvas_size - distance.point.y;
        if(y < min_y || y > max_y) continue;
        double percentage_error = ((double)distance.distance/(double)canvas_size) * 100;
        output.push_back(percentage_error);
    }
    return output;
    
}

std::vector<double> poach(std::vector<distance_info> distances, arc a, int canvas_size) {

    std::vector<double> output;
    
    for (const distance_info& distance : distances)
    {
        if(distance.distance == NOT_FOUND) continue;

        int y = canvas_size - distance.point.y;
        if(y < a.min_y || y > a.max_y) continue;
        double percentage_error = ((double)distance.distance/(double)canvas_size) * 100;
        output.push_back(percentage_error);
    }
    return output;
    
}

std::vector<double> poach(std::vector<distance_info> distances, lineline a, int canvas_size) {

    std::vector<double> output;
    
    for (const distance_info& distance : distances)
    {
        if(distance.distance == NOT_FOUND) continue;
        int y = canvas_size - distance.point.y;
        if(y < a.min_y || y > a.max_y) continue;
        double percentage_error = ((double)distance.distance/(double)canvas_size) * 100;
        output.push_back(percentage_error);
    }
    return output;
}

std::vector<std::pair<int, int>> split_into_three(int min_y, int max_y) {
    std::vector<std::pair<int, int>> output;
    
    int range = max_y - min_y + 1;
    int part_size = range / 3;
    int remainder = range % 3;
    
    int start = min_y;
    
    for (int i = 0; i < 3; i++) {
        int end = start + part_size - 1;
        if (remainder > 0) {
            end++;
            remainder--;
        }
        
        output.emplace_back(start, end);
        start = end + 1;
    }
    
    return output;
}