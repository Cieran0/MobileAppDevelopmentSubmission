#include "raylib.h"
#include "structs.hpp"
#include <cmath>
#include <vector>
#include <algorithm>

arc arc_from_points(point p1, point p2, point p3);
lineline line_from_points(point p1, point p2);
void drawLine(lineline a, Color colour);
void drawArc(arc a, int og, Color colour);