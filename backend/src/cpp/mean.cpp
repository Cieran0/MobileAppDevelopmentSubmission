#include <vector>
#include <cmath>

double calculate_mean(const std::vector<double>& data) {
    double sum = 0;
    for (double num : data) {
        sum += num;
    }
    return sum / data.size();
}

double calculate_standard_deviation(const std::vector<double>& data, double mean) {
    double variance = 0;
    for (double num : data) {
        variance += (num - mean) * (num - mean);
    }
    return std::sqrt(variance / data.size());
}

std::vector<double> remove_outliers(const std::vector<double>& data, double threshold) {
    double mean = calculate_mean(data);
    double std_dev = calculate_standard_deviation(data, mean);
    
    std::vector<double> filtered_data;
    
    for (double num : data) {
        if (std::abs(num - mean) <= threshold * std_dev) {
            filtered_data.push_back(num);
        }
    }
    
    return filtered_data;
}

double filtered_mean(const std::vector<double>& data) {
    std::vector<double> filtered_data = remove_outliers(data, 20.0);
    double new_mean = calculate_mean(filtered_data);
    return new_mean;
}