CXX = g++
CXXFLAGS = -Wall -Wextra `pkg-config --cflags opencv4`
LDFLAGS = `pkg-config --libs opencv4` -lraylib

SRC = $(wildcard *.cpp)
OBJ = $(SRC:.cpp=.o)
TARGET = libbarbell.a  # Static library target

all: $(TARGET)
	cp $(TARGET) ../../

$(TARGET): $(OBJ)
	ar rcs $@ $^  # Create the static library using 'ar'

%.o: %.cpp
	$(CXX) $(CXXFLAGS) -c $< -o $@

clean:
	rm -f $(OBJ) $(TARGET)

.PHONY: all clean
