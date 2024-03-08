/**************************************************
* 	myNewTabWE by sakuyaa.
*	
*	https://github.com/sakuyaa/
**************************************************/
'use strict';

//简化函数
const $id = id => document.getElementById(id);
//最近修改过默认css文件的扩展版本，只针对主页
const LAST_MODIFY_CSS_VERSION = '1.9';

let myNewTabWE = {
	css: {
		version: 0,
		index: '',
		weather: ''
	},
	defaultCss: {   //默认css
		index: '',
		weather: ''
	},
	
	notify: (message, title) => {
		browser.notifications.create({
			type: 'basic',
			message: message + '',
			title: title,
			iconUrl: browser.runtime.getURL('image/home.svg')
		});
	},
	
	//获取参数
	getStorage: () => {
		return new Promise((resolve, reject) => {
			browser.storage.local.get({
				css: {
					version: 0,
					index: '',
					weather: ''
				}
			}).then(storage => {
				myNewTabWE.css = storage.css;
				resolve();
			}, e => {
				myNewTabWE.notify(e, '获取定制css内容失败');
				reject();
			});
		});
	},
	
	initConf: async () => {
		if (myNewTabWE.css.index) {   //存在定制css
			if (LAST_MODIFY_CSS_VERSION != myNewTabWE.css.version) {
				$id('tips').textContent = '此扩展的默认css相对于定制主页时的默认css有改动，请检查定制css是否需要更新';
			}
		}
		let response = await fetch('../css/index.css');   //读取默认css
		myNewTabWE.defaultCss.index = (await response.text()).split(/\*{50}\/\n/)[1];   //去除文件头备注
		response = await fetch('../css/weather.css');
		myNewTabWE.defaultCss.weather = (await response.text()).split(/\*{50}\/\n/)[1];
		if (myNewTabWE.css.weather) {
			$id('weather-css').value = myNewTabWE.css.weather;
			myNewTabWE.adjustRows($id('weather-css'));
		} else {
			$id('weather-css').value = '';   //刷新后不自动填写
		}
		if (myNewTabWE.css.index) {
			$id('index-css').value = myNewTabWE.css.index;
			myNewTabWE.adjustRows($id('index-css'));
		} else {
			$id('index-css').value = '';   //刷新后不自动填写
		}
	},
	initEvent: () => {
		$id('weather-save').addEventListener('click', () => {
			myNewTabWE.css.weather = $id('weather-css').value;
			browser.storage.local.set({css: myNewTabWE.css}).then(null, e => {
				myNewTabWE.notify(e, '设置定制css内容失败');
			});
		});
		$id('index-save').addEventListener('click', () => {
			myNewTabWE.css.version = $id('index-css').value == '' ? 0 : LAST_MODIFY_CSS_VERSION;
			myNewTabWE.css.index = $id('index-css').value;
			browser.storage.local.set({css: myNewTabWE.css}).then(null, e => {
				myNewTabWE.notify(e, '设置定制css内容失败');
			});
		});
		$id('weather-default').addEventListener('click', () => {
			if (!$id('weather-css').value || confirm('是否加载默认css？')) {
				$id('weather-css').value = myNewTabWE.defaultCss.weather;
				myNewTabWE.adjustRows($id('weather-css'));
			}
		});
		$id('index-default').addEventListener('click', () => {
			if (!$id('index-css').value || confirm('是否加载默认css？')) {
				$id('index-css').value = myNewTabWE.defaultCss.index;
				myNewTabWE.adjustRows($id('index-css'));
			}
		});
		$id('weather-css').addEventListener('input', e => {
			myNewTabWE.adjustRows(e.target);
		});
		$id('index-css').addEventListener('input', e => {
			myNewTabWE.adjustRows(e.target);
		});
		
		//文本框输入Tab
		$id('weather-css').addEventListener('keydown', e => {
			if (e.key == 'Tab') {
				e.preventDefault();
				let start = e.target.selectionStart;
				e.target.value = e.target.value.substring(0, start) + '\t' +
					e.target.value.substring(e.target.selectionEnd);
				e.target.setSelectionRange(start + 1, start + 1);
			}
		});
		$id('index-css').addEventListener('keydown', e => {
			if (e.key == 'Tab') {
				e.preventDefault();
				let start = e.target.selectionStart;
				e.target.value = e.target.value.substring(0, start) + '\t' +
					e.target.value.substring(e.target.selectionEnd);
				e.target.setSelectionRange(start + 1, start + 1);
			}
		});
	},
	
	init: () => {
		myNewTabWE.initConf();
		myNewTabWE.initEvent();
	},
	
	//自动调整文本框行数
	adjustRows: textarea => {
		textarea.rows = textarea.value.split('\n').length;
	}
};

myNewTabWE.getStorage().then(myNewTabWE.init);
