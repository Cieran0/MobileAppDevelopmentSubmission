#pragma once
#include "raylib.h"
#include "structs.hpp"
#include <vector>

std::vector<distance_info> get_texture_distance(RenderTexture2D texture, std::vector<frame_point> points, int cx, int cy);
std::vector<double> poach(std::vector<distance_info> distances, int min_y, int max_y, int canvas_size);
std::vector<double> poach(std::vector<distance_info> distances, arc a, int canvas_size);
std::vector<double> poach(std::vector<distance_info> distances, lineline a, int canvas_size);
std::vector<std::pair<int, int>> split_into_three(int min_y, int max_y);