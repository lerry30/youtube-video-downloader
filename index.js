const ytdl = require('ytdl-core');
const fs = require('fs');
const { readFile, writeFile, access, stat, mkdir } = fs.promises;
const { createInterface } = require('readline');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const readline = createInterface({
	input: process.stdin,
	output: process.stdout
});

const qualityList = { '1080p60': true, '1080p50': true, '1080p': true, '720p': true };
const videoFilter = { filter: format => format.container === 'mp4' && qualityList[format.qualityLabel] };

const run = async () => {
	try {
		const data = await readFromVideoDetailsFile();
		const [ actionValue, videoData ] = await options(data);

		if(actionValue === 3) return;

		for(let i = 0; i < videoData.length; i++) {
			const details = videoData[i];
			const videoPath = details.video;
			const audioPath = details.audio;
			console.log(`downloading ${details.videoname}`);
			let merge = false;
			
			// const dirExists = await directoryExists(details.foldername);
			// if(!dirExists) await mkdir(details.foldername);
			if(details.videostatus != 'done') {
				const res = await download(details.videoUrl, videoPath, videoFilter);
				videoData[i].videostatus = res;
				writeFromVideoDetailsFile(videoData);
				merge = true;
			}
		
			if(details.audiostatus != 'done') {
				const res = await download(details.videoUrl, audioPath);
				videoData[i].audiostatus = res;
				writeFromVideoDetailsFile(videoData);
				merge = true;
			}	

			if(!merge) continue;

			const { error, stdout, stderr } = await exec(`./merge-video-n-audio ${ details.videoname }`);

			console.log(`video ${ details.videoname } is completed`);
			console.log('Error: ', error);
			console.log(stderr);
		}
	} catch (error) {
		console.log(error)
	}
}

run();

// download(videoUrl, outputVideo, videoFilter)
//   .then(() => download(videoUrl, outputAudio));

function download(videoUrl, output = 'audio.mp3', defFilter = { filter: 'audioonly' }) {
  const range = {};
  const flags = { flags: 'w' };
  
  if (fs.existsSync(output)) {
    // If the output file already exists, resume downloading from where we left off
    const stats = fs.statSync(output);
    range.start = stats.size;
    flags.flags = 'a';
  }
  
  // const fileExist = await directoryExists(output);
  // const fileData = (fileExist) ? await stat(output) : { size: -1 };

  const stream = ytdl(videoUrl, { range, ...defFilter }); 
  stream.pipe(fs.createWriteStream(output, flags));

  stream.on('progress', (chunkLength, downloaded, total) => {
    const floatDownloaded = downloaded / 1_000_000;
    const floatTotal = total / 1_000_000;
    const percentage = (downloaded / total) * 100;

    console.log(`${floatDownloaded.toFixed(2)} MB of ${floatTotal.toFixed(2)} MB ${percentage.toFixed(2)}%`); 
  });

  
  return new Promise((resolve, reject) => {
    stream.on('finish', () => {
      resolve('done')
    });

    stream.on('error', (error) => {
      console.log(error);
      reject('error');
    });
  });
}

async function directoryExists(dirPath) {
  try {
    await access(dirPath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function readFromVideoDetailsFile() {
  try {
    const videoDataInJson = await readFile('./video-details.json', 'utf8');
    return JSON.parse(videoDataInJson);
  } catch(error) {
    console.log(error);
    return [];
  }
}

async function writeFromVideoDetailsFile(content) {
  try {
    const newVideoData = JSON.stringify(content, null, 4);
    await writeFile('./video-details.json', newVideoData);
  } catch(error) {
    console.log(error);
  }
}

async function  prompt(question) {
	const readLineAsync = msg => {
		return new Promise(resolve => {
			readline.question(msg, userRes => resolve(userRes));
		});
	}

	const userRes = await readLineAsync(question);
	return userRes;
}

async function options(data) {
	let videoData = typeof data === 'object' ? Object.values(data) : data;
	let menuRes = await prompt(`
	Options - input the designated number for certain action:
		1: Continue where the downloading's left
		2: Add new video to download
		3: exit
	
	Default: 1
	
	>> `);
	
	menuRes = Number(menuRes);
	let returnValue = [ menuRes, videoData ];

	if(Number(menuRes) === 2) {
		const videoLink = await getVideoLink();
		const videoName = await getVideoName();

		const newVideo = {
			videoUrl: videoLink,
			videoname: videoName,
			video: 'video.mp4',
			audio: 'audio.mp3',
			videostatus: 'pending',
			audiostatus: 'pending'
		};

		videoData.push(newVideo);
		await writeFromVideoDetailsFile(videoData);
		returnValue = await options(videoData);
	}

	readline.close();
	return returnValue;
}

async function getVideoLink() {
	const videoLink = await prompt('Paste the URL of video or press Control + C to exit:');
	if(!videoLink || !videoLink.startsWith('https://www.youtube.com/watch?v=')) {
		return getVideoLink();
	}

	return videoLink;
}

async function getVideoName() {
	const videoName = await prompt('Type the video title or press Control + C to exit:');
	if(!videoName) {
		return getVideoName();
	}

	return videoName;
}

// // https://nextjs.org/learn/foundations/from-javascript-to-react/adding-interactivity-with-state
// // https://www.youtube.com/watch?v=6viHboa83iY