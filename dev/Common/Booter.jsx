
import window from 'window';
import progressJs from 'progressJs';
import Promise from 'Promise';

import STYLES_CSS from 'Styles/@Boot.css';
import LAYOUT_HTML from 'Html/Layout.html';

import {getHash, setHash, clearHash} from 'Storage/RainLoop';

let RL_APP_DATA_STORAGE = null;

/* eslint-disable  */
window.__rlah = () => getHash();
window.__rlah_set = () => setHash();
window.__rlah_clear = () => clearHash();
window.__rlah_data = () => RL_APP_DATA_STORAGE;
/* eslint-enable */

/**
 * @param {string} id
 * @param {string} name
 * @returns {string}
 */
function getComputedStyle(id, name)
{
	var element = window.document.getElementById(id);
	return element.currentStyle ? element.currentStyle[name] :
		(window.getComputedStyle ? window.getComputedStyle(element, null).getPropertyValue(name) : null);
}

/**
 * @param {string} styles
 * @returns {void}
 */
function includeStyle(styles)
{
	window.document.write(unescape('%3Csty' + 'le%3E' + styles + '"%3E%3C/' + 'sty' + 'le%3E')); // eslint-disable-line no-useless-concat
}

/**
 * @param {string} src
 * @returns {void}
 */
function includeScr(src)
{
	window.document.write(unescape('%3Csc' + 'ript type="text/jav' + 'ascr' + 'ipt" data-cfasync="false" sr' + 'c="' + src + '"%3E%3C/' + 'scr' + 'ipt%3E')); // eslint-disable-line no-useless-concat
}

/**
 * @returns {boolean}
 */
function includeLayout()
{
	const app = window.document.getElementById('rl-app');

	if (STYLES_CSS)
	{
		includeStyle(STYLES_CSS);
	}

	if (app && LAYOUT_HTML)
	{
		app.innerHTML = LAYOUT_HTML.replace(/[\r\n\t]+/g, '');
		return true;
	}

	return false;
}

/**
 * @param {mixed} data
 * @returns {void}
 */
function includeAppScr({admin = false, mobile = false, mobileDevice = false})
{
	let src = './?/';
	src += admin ? 'Admin' : '';
	src += 'AppData@';
	src += mobile ? 'mobile' : 'no-mobile';
	src += mobileDevice ? '-1' : '-0';
	src += '/';

	includeScr(src + (window.__rlah ? window.__rlah() || '0' : '0') + '/' + window.Math.random().toString().substr(2) + '/');
}

/**
 * @returns {object}
 */
function getRainloopBootData()
{
	let result = {};
	const meta = window.document.getElementById('app-boot-data');

	if (meta && meta.getAttribute)
	{
		result = JSON.parse(meta.getAttribute('content')) || {};
	}

	return result;
}

/**
 * @param {string} additionalError
 * @returns {void}
 */
function showError(additionalError)
{
	const
		oR = window.document.getElementById('rl-loading'),
		oL = window.document.getElementById('rl-loading-error'),
		oLA = window.document.getElementById('rl-loading-error-additional');

	if (oR)
	{
		oR.style.display = 'none';
	}

	if (oL)
	{
		oL.style.display = 'block';
	}

	if (oLA && additionalError)
	{
		oLA.style.display = 'block';
		oLA.innerHTML = additionalError;
	}

	if (progressJs)
	{
		progressJs.set(100).end();
	}
}

/**
 * @param {string} description
 * @returns {void}
 */
function showDescriptionAndLoading(description)
{
	const
		oE = window.document.getElementById('rl-loading'),
		oElDesc = window.document.getElementById('rl-loading-desc');

	if (oElDesc && description)
	{
		oElDesc.innerHTML = description;
	}

	if (oE && oE.style)
	{
		oE.style.opacity = 0;
		window.setTimeout(() => {
			oE.style.opacity = 1;
		}, 300);
	}
}

/**
 * @param {boolean} withError
 * @param {string} additionalError
 * @returns {void}
 */
function runMainBoot(withError, additionalError)
{
	if (window.__APP_BOOT && !withError)
	{
		window.__APP_BOOT(() => {
			showError(additionalError);
		});
	}
	else
	{
		showError(additionalError);
	}
}

/**
 * @returns {void}
 */
function runApp()
{
	const appData = window.__rlah_data();

	if (window.jassl && progressJs && appData && appData.TemplatesLink && appData.LangLink &&
		appData.StaticLibJsLink && appData.StaticAppJsLink && appData.StaticEditorJsLink)
	{
		const p = progressJs;

		p.setOptions({theme: 'rainloop'});
		p.start().set(5);

		const
			libs = window.jassl(appData.StaticLibJsLink).then(() => {
				if (window.$)
				{
					window.$('#rl-check').remove();

					if (appData.IncludeBackground)
					{
						window.$('#rl-bg').attr('style', 'background-image: none !important;')
							.backstretch(appData.IncludeBackground.replace('{{USER}}',
								(window.__rlah ? (window.__rlah() || '0') : '0')), {fade: 100, centeredX: true, centeredY: true})
							.removeAttr('style');
					}
				}
			}),
			common = Promise.all([
				window.jassl(appData.TemplatesLink),
				window.jassl(appData.LangLink)
			]);

		Promise.all([libs, common])
			.then(() => {
				p.set(30);
				return window.jassl(appData.StaticAppJsLink);
			})
			.then(() => {
				p.set(50);
				return appData.PluginsLink ? window.jassl(appData.PluginsLink) : window.Promise.resolve();
			})
			.then(() => {
				p.set(70);
				runMainBoot(false);
			})
			.catch((e) => {
				runMainBoot(true);
				throw e;
			})
			.then(() => window.jassl(appData.StaticEditorJsLink))
			.then(() => {
				if (window.CKEDITOR && window.__initEditor) {
					window.__initEditor();
					window.__initEditor = null;
				}
			});
	}
	else
	{
		runMainBoot(true);
	}
}

/**
 * @param {mixed} data
 * @returns {void}
 */
window.__initAppData = function(data) {

	RL_APP_DATA_STORAGE = data;

	window.__rlah_set();

	if (RL_APP_DATA_STORAGE)
	{
		if (RL_APP_DATA_STORAGE.NewThemeLink)
		{
			(window.document.getElementById('app-theme-link') || {}).href = RL_APP_DATA_STORAGE.NewThemeLink;
		}

		if (RL_APP_DATA_STORAGE.IncludeCss)
		{
			includeStyle(RL_APP_DATA_STORAGE.IncludeCss);
		}

		showDescriptionAndLoading(RL_APP_DATA_STORAGE.LoadingDescriptionEsc || '');
	}

	runApp();
};

/**
 * @returns {void}
 */
window.__runBoot = function() {

	if (!window.navigator || !window.navigator.cookieEnabled)
	{
		window.document.location.replace('./?/NoCookie');
	}

	if ('none' !== getComputedStyle('rl-check', 'display'))
	{
		const root = document.documentElement;
		root.className += ' no-css';
	}

	if (includeLayout())
	{
		includeAppScr(getRainloopBootData());
	}
};

