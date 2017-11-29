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
	config: {},
	imageData: {},
	sites: {},
	
	notify: (message, title) => {
		browser.notifications.create({
			type: 'basic',
			message: message + '',
			title: title,
			iconUrl: browser.extension.getURL('image/myNewTabWE.svg')
		});
	},
	
	//获取参数
	getStorage: () => {
		return new Promise((resolve, reject) => {
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
					imageName: '',
					imageUrl: ''
				},
				sites: {}
			}).then(storage => {
				myNewTabWE.config = storage.config;
				myNewTabWE.imageData = storage.imageData;
				myNewTabWE.sites = storage.sites;
				resolve();
			}, e => {
				myNewTabWE.notify(e, '获取myNewTabWE配置失败');
				reject();
			});
		});
	},
	setStorage: isConfig => {
		if (isConfig) {   //保存配置
			browser.storage.local.set({config: myNewTabWE.config}).then(null, e => {
				myNewTabWE.notify(e, '设置readLater配置失败');
			});
		} else {   //保存网址列表
			browser.storage.local.set({sites: myNewTabWE.sites}).then(null, e => {
				myNewTabWE.notify(e, '设置readLater配置失败');
			});
		}
	},
	
	//初始化导入导出功能
	initImportExport: () => {
		$id('import').addEventListener('click', () => {
			let input = document.createElement('input');
			input.setAttribute('accept', 'application/json');
			input.setAttribute('hidden', 'hidden');
			input.setAttribute('type', 'file');
			document.body.appendChild(input);
			input.addEventListener('change', () => {
				let reader = new FileReader();
				reader.onload = () => {
					let storage;
					try {
						storage = JSON.parse(reader.result);
					} catch(e) {
						myNewTabWE.notify(e, '导入myNewTabWE配置失败');
						return;
					}
					browser.storage.local.set(storage).then(() => {
						location.reload();   //刷新网页
					}, e => {
						myNewTabWE.notify(e, '设置myNewTabWE配置失败');
					});
				};
				reader.readAsText(input.files[0]);
			}, {once: true});
			input.click();
		}, false);
		$id('export').addEventListener('click', () => {
			let download = document.createElement('a');
			download.setAttribute('download', 'myNewTabWE.json');
			let storage = {
				config: myNewTabWE.config,
				imageData: myNewTabWE.imageData,
				sites: myNewTabWE.sites
			};
			download.setAttribute('href', URL.createObjectURL(new Blob([JSON.stringify(storage, null, '\t')])));
			download.dispatchEvent(new MouseEvent('click'));
		}, false);
	},
	//初始化选项
	initConf: () => {
		$id('newtab-open').checked = myNewTabWE.config.newTabOpen;
		$id('bing-max-history').value = myNewTabWE.config.bingMaxHistory;
		if (myNewTabWE.config.useBigImage) {
			$id('1920').checked = true;
		} else {
			$id('1366').checked = true;
		}
		$id('title').value = myNewTabWE.config.title;
		$id('weather-src').value = myNewTabWE.config.weatherSrc;
		myNewTabWE.confListener();
	},
	
	init: () => {
		myNewTabWE.initImportExport();
		myNewTabWE.initConf();
	},
	
	//选项变更时保存
	confListener: () => {
		$id('newtab-open').addEventListener('click', e => {
			myNewTabWE.config.newTabOpen = e.target.checked;
			myNewTabWE.setStorage(true);
		});
		$id('bing-max-history').addEventListener('change', e => {
			myNewTabWE.config.bingMaxHistory = e.target.value;
			myNewTabWE.setStorage(true);
		});
		$id('1920').addEventListener('click', () => {
			myNewTabWE.config.useBigImage = true;
			myNewTabWE.setStorage(true);
		});
		$id('1366').addEventListener('click', () => {
			myNewTabWE.config.useBigImage = false;
			myNewTabWE.setStorage(true);
		});
		$id('title').addEventListener('change', e => {
			myNewTabWE.config.title = e.target.value;
			myNewTabWE.setStorage(true);
		});
		$id('weather-src').addEventListener('change', e => {
			myNewTabWE.config.weatherSrc = e.target.value;
			myNewTabWE.setStorage(true);
		});
	}
};

myNewTabWE.getStorage().then(() => {myNewTabWE.init()});
