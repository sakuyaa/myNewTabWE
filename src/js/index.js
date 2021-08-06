/**************************************************
* 	myNewTabWE by sakuyaa.
*	
*	https://github.com/sakuyaa/
**************************************************/
'use strict';

//简化函数
const $id = id => document.getElementById(id);
const DEFAULT_CONFIG = {
	config: {
		autoChange: true,   //自动切换壁纸
		autoDownload: false,   //自动下载壁纸
		bingMaxHistory: 8,   //最大历史天数，可设置[2, 8]
		downloadDir: 'bingImg',   //相对于浏览器下载文件夹的目录
		newTabOpen: true,   //是否新标签页打开导航链接
		title: '我的主页',   //网页标题
		useBigImage: true,   //bing图片的尺寸，0为默认的1366x768，1为1920x1080
		userImage: false,   //使用自定义壁纸
		userImageSrc: '',   //自定义壁纸的URL
		weatherSrc: 'https://i.tianqi.com/index.php?c=code&id=8&num=3'   //天气代码的URL
	},
	sites: [],
	css: {
		index: '',
		weather: ''
	}
};

let myNewTabWE = {
	bingIndex: 0,   //Bing图片历史天数
	config: {},
	sites: [],
	css: {
		index: '',
		weather: ''
	},
	
	//显示桌面通知
	notify: (message, title) => {
		browser.notifications.create({
			type: 'basic',
			message: message + '',
			title: title,
			iconUrl: browser.extension.getURL('image/home.svg')
		});
	},
	
	//获取参数
	getStorage: () => {
		return new Promise((resolve, reject) => {
			browser.storage.local.get(DEFAULT_CONFIG).then(storage => {
				myNewTabWE.config = storage.config;
				myNewTabWE.sites = storage.sites;
				myNewTabWE.css = storage.css;
				resolve();
			}, e => {
				myNewTabWE.notify(e, '获取myNewTabWE配置失败');
				reject();
			});
		});
	},
	
	//初始化css
	initCss: () => {
		if (myNewTabWE.css.index) {
			let style = document.createElement('style');
			style.appendChild(document.createTextNode(myNewTabWE.css.index));
			document.head.appendChild(style);
		} else {
			let link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = '../css/index.css';
			document.head.appendChild(link);
		}
	},
	//初始化日期
	initDate: () => {
		localStorage.setItem('date', Date.now());
		let date = Solar.getSolar(new Date());
		$id('solar-date').textContent = date.date;
		$id('solar-festival').textContent = date.festival;
		$id('solar-holiday').textContent = date.holiday;
		date = Lunar.getLunar(new Date());
		$id('lunar-date').textContent = date.date;
		$id('lunar-festival').textContent = date.festival;
		$id('lunar-holiday').textContent = date.holiday;
	},
	//初始化导航网址
	initSite: () => {
		let table = $id('navtable');
		for(let list of myNewTabWE.sites) {
			if (list.name.toLowerCase() == 'yooo') {   //神秘的代码
				let yooo = myNewTabWE.buildTr(list);
				yooo.setAttribute('hidden', 'hidden');
				yooo.setAttribute('name', 'yooo');
				table.appendChild(yooo);
			} else {
				table.appendChild(myNewTabWE.buildTr(list));
			}
		}
	},
	//初始化监听器
	initListener: () => {
		//神秘的代码
		addEventListener('keydown', e => {
			if (e.key == 'q' && e.ctrlKey) {
				for (let yooo of document.getElementsByName('yooo')) {
					yooo.removeAttribute('hidden');
				}
			}
		});
		addEventListener('keyup', e => {
			for (let yooo of document.getElementsByName('yooo')) {
				yooo.setAttribute('hidden', 'hidden');
			}
		});
		
		$id('change').addEventListener('click', () => {
			if (myNewTabWE.isNewDate()) {
				myNewTabWE.bingIndex = 0;   //过0点重新获取
			} else {
				myNewTabWE.bingIndex++;
			}
			myNewTabWE.getBingImage();
		});
		
		//自动判断并切换天气、日期和壁纸
		setInterval(() => {
			if (myNewTabWE.config.weatherSrc) {
				$id('weather').src = myNewTabWE.config.weatherSrc;
			}
			if (myNewTabWE.isNewDate('date')) {
				myNewTabWE.initDate();
			}
			if (!myNewTabWE.config.userImage && myNewTabWE.config.autoChange && myNewTabWE.isNewDate()) {
				myNewTabWE.bingIndex = 0;
				myNewTabWE.getBingImage();
			}
		}, 3600000);
	},
	//初始化背景图片
	initImage: () => {
		if (myNewTabWE.config.userImage) {   //使用自定义壁纸
			document.body.style.backgroundImage = `url("${myNewTabWE.config.userImageSrc}")`;
			$id('download').setAttribute('hidden', 'hidden');
		} else {
			let imageSrc = localStorage.getItem('imageSrc');
			if (imageSrc) {
				document.body.style.backgroundImage = `url("${imageSrc}")`;
				$id('download').setAttribute('download', localStorage.getItem('imageName'));
				$id('download').setAttribute('href', URL.createObjectURL(myNewTabWE.dataURItoBlob(imageSrc)));
				if (myNewTabWE.isNewDate()) {
					myNewTabWE.getBingImage();   //过0点重新获取
				}
			} else {
				myNewTabWE.getBingImage();
			}
		}
	},
	//初始化天气
	initWeather: () => {
		return new Promise((resolve, reject) => {
			$id('weather').onload = async () => {
				for (let tab of await browser.tabs.query({url: browser.extension.getURL('html/index.html')})) {
					for (let frame of await browser.webNavigation.getAllFrames({tabId: tab.id})) {
						if (frame.frameId) {
							//天气页面插入css
							if (myNewTabWE.css.weather) {
								await browser.tabs.insertCSS(tab.id, {
									code: myNewTabWE.css.weather,
									cssOrigin: 'user',
									frameId: frame.frameId,
									runAt: 'document_start'
								});
							} else {
								await browser.tabs.insertCSS(tab.id, {
									cssOrigin: 'user',
									file: browser.extension.getURL('css/weather.css'),
									frameId: frame.frameId,
									runAt: 'document_start'
								});
							}
							//自动适应页面大小
							let size = (await browser.tabs.executeScript(tab.id, {
								code: '[document.body.scrollHeight, document.body.scrollWidth]',
								frameId: frame.frameId,
								runAt: 'document_end'
							}))[0];
							$id('weather').style.height = size[0] + 'px';
							$id('weather').style.width = size[1] + 'px';
						}
					}
				}
			};
			$id('weather').src = myNewTabWE.config.weatherSrc;
			resolve();
		});
		
	},
	
	init: () => {
		document.title = myNewTabWE.config.title;
		myNewTabWE.initCss();
		myNewTabWE.initDate();
		myNewTabWE.initSite();
		myNewTabWE.initListener();
		myNewTabWE.initImage();
		
		if (myNewTabWE.config.weatherSrc) {
			myNewTabWE.initWeather().then(null, e => {
				console.log('天气栏css加载失败：' + e);
			});
		}
	},
	
	getBingImage: async () => {
		let data, image;
		try {
			data = (await myNewTabWE.httpRequest(`https://cn.bing.com/HPImageArchive.aspx?format=js&n=1&mkt=zh-CN&idx=${myNewTabWE.bingIndex % myNewTabWE.config.bingMaxHistory}`,
				'json', 'https://cn.bing.com/')).images[0];
			if (!data.url.startsWith('http')) {   //处理图片地址
				data.url = 'https://www.bing.com' + data.url;
			}
			image = await myNewTabWE.httpRequest(myNewTabWE.config.useBigImage ?
				data.url.replace('1366x768', '1920x1080') : data.url.replace('1920x1080', '1366x768'),
				'blob', 'https://cn.bing.com/');
		} catch (e) {
			myNewTabWE.notify(e, '获取图片失败');
			return;
		}
		let reader = new FileReader();
		reader.onload = () => {
			document.body.style.backgroundImage = `url("${reader.result}")`;
			
			//保存图片和获取时间
			localStorage.setItem('lastCheckTime', Date.now());
			let imageName = data.enddate + '-' +
				data.copyright.replace(/\(.*?\)/g, '').trim()
				.replace(/(\\|\/|\*|\|)/g, '')   //Win文件名不能包含下列字符
				.replace(/:/g, '：')
				.replace(/\?/g, '？')
				.replace(/("|<|>)/g, '\'') + '.jpg';
			localStorage.setItem('imageName', imageName);
			localStorage.setItem('imageSrc', reader.result);
			
			//设置图片下载链接
			$id('download').setAttribute('download', imageName);
			$id('download').setAttribute('href', URL.createObjectURL(image));
			//自动下载壁纸
			if (myNewTabWE.config.autoDownload) {
				if (myNewTabWE.config.downloadDir) {
					imageName = myNewTabWE.config.downloadDir + '/' + imageName;
				}
				browser.downloads.download({
					conflictAction: 'overwrite',   //覆盖旧文件避免出现重复文件
					filename: imageName,
					url: URL.createObjectURL(image)
				});
			}
		};
		reader.readAsDataURL(image);
	},
	
	buildTr: list => {
		let tr = document.createElement('tr'),
			th = document.createElement('th'),
			td, a, img, textNode, path;
		
		//添加分类
		th.textContent = list.name;
		tr.appendChild(th);
		
		//添加站点
		for (let site of list.list) {
			td = document.createElement('td');
			a = document.createElement('a');
			img = document.createElement('img');
			textNode = document.createTextNode(site.title);
			
			a.setAttribute('href', site.url);
			if (myNewTabWE.config.newTabOpen) {
				a.setAttribute('target', '_blank');
			}
			img.src = site.icon ? site.icon : '../image/default.svg';
			
			a.appendChild(img);
			a.appendChild(textNode);
			td.appendChild(a);
			tr.appendChild(td);
		}
		return tr;
	},
	
	dataURItoBlob: dataURI => {
		let byteString = atob(dataURI.substring(dataURI.indexOf(',') + 1));
		let arrayBuffer = new ArrayBuffer(byteString.length);
		let array = new Uint8Array(arrayBuffer);
		for (let i = 0; i < byteString.length; i++) {
			array[i] = byteString.charCodeAt(i);
		}
		return new Blob([arrayBuffer], {type: dataURI.substring(dataURI.indexOf(':') + 1, dataURI.indexOf(';'))});
	},
	
	isNewDate: item => {
		let today = new Date();
		today.setHours(0, 0, 0);   //毫秒就不管了
		if (new Date(parseInt(localStorage.getItem(item ? item : 'lastCheckTime'))) < today) {
			return true;
		}
		return false;
	},
	
	httpRequest: (url, type, referrer) => {
		return new Promise((resolve, reject) => {
			let xhr = new XMLHttpRequest();
			if (type) {
				xhr.responseType = type;
			}
			xhr.open('GET', url);
			if (referrer) {
				xhr.setRequestHeader('referrer', referrer);
			}
			xhr.onload = () => {
				if (xhr.status == 200) {
					resolve(xhr.response);
				} else {
					reject(new Error(xhr.statusText));
				}
			};
			xhr.onerror = () => {
				reject(new Error('网络错误'));
			};
			xhr.send(null);
		});
	}
};

myNewTabWE.getStorage().then(myNewTabWE.init);
