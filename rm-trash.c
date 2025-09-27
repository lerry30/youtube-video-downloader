#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <dirent.h>
#include <ctype.h>

int starts_with_numbers_followed_by_player_script(const char *filename) {
    // Check if filename starts with digits
    int i = 0;
    while (isdigit(filename[i])) {
        i++;
    }
    // Check if the rest matches "-player-script.js"
    const char *suffix = "-player-script.js";
    if (i > 0 && strcmp(filename + i, suffix) == 0) {
        return 1; // Matches pattern: <numbers>-player-script.js
    }
    return 0;
}

int main() {
    DIR *dir = opendir(".");
    if (dir == NULL) {
        perror("Cannot open directory");
        return 1;
    }

    struct dirent *entry;
    while ((entry = readdir(dir)) != NULL) {
        // Process only regular files
        if (entry->d_type == DT_REG) {
            // Check if filename matches the pattern
            if (starts_with_numbers_followed_by_player_script(entry->d_name)) {
                // Construct full path (relative to current directory)
                char filepath[1024];
                snprintf(filepath, sizeof(filepath), "./%s", entry->d_name);

                // Delete the file
                if (remove(filepath) == 0) {
                    printf("Deleted: %s\n", filepath);
                } else {
                    perror("Error deleting file");
                }
            }
        }
    }

    closedir(dir);
    return 0;
}
