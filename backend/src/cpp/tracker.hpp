#pragma once
#include <vector>
#include <string>

extern "C" {
    struct ProcessedVideo {
        bool succeeded;
        double averages[6];
        char new_path[256];
    };

    ProcessedVideo process_bar_path(const char *input_path, const char *output_path, int b_x, int b_y, int b_width, int b_height);
}

double filtered_mean(const std::vector<double>& data);