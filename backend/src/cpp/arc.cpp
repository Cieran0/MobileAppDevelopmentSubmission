#include "raylib.h"
#include "structs.hpp"
#include <cmath>
#include <vector>
#include <algorithm>

arc arc_from_points(point p1, point p2, point p3) {
    double x1 = p1.x, y1 = p1.y;
    double x2 = p2.x, y2 = p2.y;
    double x3 = p3.x, y3 = p3.y;
    
    double D = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
    
    double h = ((x1 * x1 + y1 * y1) * (y2 - y3) + (x2 * x2 + y2 * y2) * (y3 - y1) + (x3 * x3 + y3 * y3) * (y1 - y2)) / D;
    double k = ((x1 * x1 + y1 * y1) * (x3 - x2) + (x2 * x2 + y2 * y2) * (x1 - x3) + (x3 * x3 + y3 * y3) * (x2 - x1)) / D;
    
    double r = sqrt((x1 - h) * (x1 - h) + (y1 - k) * (y1 - k));
    
    double min_x = std::min({x1, x2, x3});
    double max_x = std::max({x1, x2, x3});
    double min_y = std::min({y1, y2, y3});
    double max_y = std::max({y1, y2, y3});
    
    return arc {h, k, r, min_x, max_x, min_y, max_y};
}

lineline line_from_points(point p1, point p2) {
    double max_y = std::max(p1.y, p2.y);
    double min_y = std::min(p1.y, p2.y);
    double x = p1.x;
    
    return lineline {x, min_y, max_y};
}

void drawLine(lineline a, Color colour) {
    DrawLineEx({(float)a.x, (float)a.min_y}, {(float)a.x, (float)a.max_y}, 6, colour);
}

void drawArc(arc a, int og, Color colour) {
    float desmosX = a.h;
    float desmosY = a.k;
    float radius = a.r;

    int min_x = a.min_x;
    int min_y = a.min_y;
    int max_x = a.max_x;
    int max_y = a.max_y;

    BeginScissorMode(min_x, min_y, max_x - min_x + og/2, max_y - min_y + og/2);
    
    DrawRing({desmosX, desmosY}, radius-3, radius+3, 0, 360, 360, colour);

    DrawRectangle(0, 0, min_x, min_y, Fade(BLACK, 0.0f));

    EndScissorMode();
    
}