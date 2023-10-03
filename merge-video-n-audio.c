#include <stdio.h>
#include <stdlib.h>

size_t strlen(const char *);
char* strmerge(char *, char *, int);

int main(int argc, char **argv) {
    char *videoname = strmerge(argv[1], ".mp4", 0);
    char *rawcommand = "ffmpeg -i video.mp4 -i audio.mp3 -map 0:v -map 1:a -c:v copy -c:a copy";
    
    char *videopath = strmerge("./videos/", videoname, 0);
    char *with_outputname = strmerge(rawcommand, videopath, 1);
    char *command = strmerge(with_outputname, "-y", 1);

    free(videoname);
    free(videopath);
    free(with_outputname);

    system(command);

    // printf("Successfully merged files\n");

    remove("video.mp4");
    remove("audio.mp3");

    return 0;
}

// count the number of characters
size_t strlen(const char *str) {
    size_t n = 0;
    while (str[n]) ++n;

    return n;
}

char* strmerge(char *firstword, char *secondword, int space) {
    int s_offirstword = strlen(firstword);
    int s_ofsecondword = strlen(secondword);
    int size = s_offirstword + s_ofsecondword;

    char *mergedstr = (char *)malloc(size+1+space); // plus one for null terminator and one for space in between
    if(!mergedstr) return NULL;

    for(int i = 0; i < s_offirstword; i++) {
        mergedstr[i] = (char)firstword[i];
    }

    if(space == 1) mergedstr[s_offirstword] = ' '; // space in between

    for(int i = 0; i < s_ofsecondword; i++) {
        mergedstr[ s_offirstword + space + i ] = (char)secondword[i];
    }

    mergedstr[size + space] = '\0';
    
    return mergedstr;
}