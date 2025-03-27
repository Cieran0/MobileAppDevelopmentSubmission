#pragma once

struct arc {
    double h;
    double k;
    double r;
    double min_x;
    double max_x;
    double min_y;
    double max_y;
};

struct point {
    double x;
    double y;
};

struct frame_point {
    int x;
    int y;
    int frame_idx;
};

struct lineline {
    double x;
    double min_y;
    double max_y;
};

struct distance_info {
    frame_point point;
    int distance;
};

struct rendered_point {
    int x;
    int y;
    bool acsent;
};

extern int width;
extern int height;