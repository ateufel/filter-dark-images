const fs = require('fs');
const gm = require('gm').subClass({imageMagick: true});
const _cliProgress = require('cli-progress');
const Confirm = require('prompt-confirm');

const prompt = new Confirm('Do you want to proceed?');
const progressBar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);

const minBrightnessLevel = 0.45;

const getBrightnessLevel = (filename) => {
	return new Promise(function (resolve, reject) {
		gm(filename).identify({format:'%[fx:lightness]'}, (err, info) => {
			if (err) {
				reject();
			} else {
				resolve(parseFloat(info));
			}
		});
	});
};

(async () => {
	let images = fs.readdirSync('images');
	let imagesWithBrightness = [];

	try {
		console.log('processing images...');
		progressBar.start(images.length, 0);
		for (let i = 0; i < images.length; i++) {
			//detect brightness for every single image
			const brightness = await getBrightnessLevel(`images/${images[i]}`);
			imagesWithBrightness[i] = {
				fileName: images[i],
				brightness: brightness
			};
			progressBar.update(i + 1);
		}
		progressBar.stop();

		const imagesToDelete = imagesWithBrightness.filter((elem) => elem.brightness < minBrightnessLevel);
		console.log(`number of images to delete: ${imagesToDelete.length}`);
		const answer = await prompt.run();
		if (answer) {
			//remove images from folder
			console.log('deleting images...');
			progressBar.start(imagesToDelete.length, 0);
			for (let i = 0; i < imagesToDelete.length; i++) {
				fs.unlinkSync(`images/${imagesToDelete[i].fileName}`);
				progressBar.update(i + 1);
			}
			progressBar.stop();
			console.log('done');
		}
		process.exit(0);
	} catch (err) {
		console.log(err);
		process.exit(1);
	}
})();
