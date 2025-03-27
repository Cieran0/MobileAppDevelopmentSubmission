#include "preprocess.hpp"

std::vector<frame_point> process_video(cv::VideoCapture& cap, const cv::Rect& barbell_bbox) {
    cv::ocl::setUseOpenCL(false);   
    
    std::vector<frame_point> center_points;

    int total_frames = static_cast<int>(cap.get(cv::CAP_PROP_FRAME_COUNT));
    center_points.reserve(total_frames);

    cv::Mat frame;
    cap >> frame;
    if (frame.empty()) {
        std::cout << "Error: Could not read the first frame." << std::endl;
        exit(1);
    }

    cv::Ptr<cv::TrackerCSRT> tracker = cv::TrackerCSRT::create();
    tracker->init(frame, barbell_bbox);

    int frame_idx = 0;

    while (cap.read(frame)) {
        if (frame.empty()) break;

        cv::Rect bbox;
        bool success = tracker->update(frame, bbox);
        if (success) {
            int center_x = bbox.x + bbox.width / 2;
            int center_y = bbox.y + bbox.height / 2;
            center_points.push_back(frame_point{center_x, center_y, frame_idx});
        }

        frame_idx++;
    }


    return center_points;
}