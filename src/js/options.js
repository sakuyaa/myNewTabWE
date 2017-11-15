/**************************************************
* 	myNewTabWE by sakuyaa.
*	
*	https://github.com/sakuyaa/
**************************************************/
'use strict';

//简化函数
const $id = id => {
	return document.getElementById(id);
};

let myNewTabWE = {
	notify: (message, title) => {
		browser.notifications.create({
			type: 'basic',
			message: message + '',
			title: title,
			iconUrl: browser.extension.getURL('image/myNewTabWE.svg')
		});
	},
	
	importConf: text => {
		let storage;
		try {
			storage = JSON.parse(text);
		} catch(e) {
			myNewTabWE.notify(e, '导入myNewTabWE配置失败');
			return;
		}
		browser.storage.local.set(storage).then(() => {
			location.reload();   //刷新网页
		}, e => {
			myNewTabWE.notify(e, '设置myNewTabWE配置失败');
		});
	},
	exportConf: storage => {
		let download = document.createElement('a');
		download.setAttribute('download', 'myNewTabWE.json');
		download.setAttribute('href', URL.createObjectURL(new Blob([JSON.stringify(storage, null, '\t')])));
		download.dispatchEvent(new MouseEvent('click'));
	},
	
	init: () => {
		$id('import').addEventListener('click', () => {
			let input = document.createElement('input');
			input.setAttribute('accept', 'application/json');
			input.setAttribute('hidden', 'hidden');
			input.setAttribute('type', 'file');
			document.body.appendChild(input);
			input.addEventListener('change', () => {
				let reader = new FileReader();
				reader.onload = () => {
					myNewTabWE.importConf(reader.result);
				};
				reader.readAsText(input.files[0]);
			}, {once: true});
			input.click();
		}, false);
		$id('export').addEventListener('click', () => {
			browser.storage.local.get({   //默认值
				config: {
					bingMaxHistory: 10,   //最大历史天数，可设置[2, 16]
					newTabOpen: true,   //是否新标签页打开导航链接
					title: '我的主页',   //网页标题
					useBigImage: true,   //bing图片的尺寸，0为默认的1366x768，1为1920x1080
					weatherSrc: 'http://i.tianqi.com/index.php?c=code&id=8&num=3'   //天气代码的URL
				},
				imageData: {
					lastCheckTime: 0,
					imageUrl: ''
				},
				sites: {}
			}).then(storage => {
				myNewTabWE.exportConf(storage);
			}, e => {
				myNewTabWE.notify(e, '获取myNewTabWE配置失败');
			});
		}, false);
	}
};

myNewTabWE.init();
