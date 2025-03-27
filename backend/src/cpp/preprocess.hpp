#pragma once
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
#include <vector>
#include <string>

double filtered_mean(const std::vector<double>& data);
std::vector<frame_point> process_video(cv::VideoCapture& cap, const cv::Rect& barbell_bbox);