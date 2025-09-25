// Lightweight i18n utility for static sites
// Usage:
// 1) Include this file on each HTML page before your page-specific script
// 2) Add data-i18n="path.to.key" to elements with text content
// 3) Add data-i18n-placeholder to inputs for placeholder translation
// 4) Call I18n.init({ translations, defaultLang: 'en' })

const I18n = (() => {
	const elements = {
		textNodes: () => document.querySelectorAll('[data-i18n]'),
		placeholders: () => document.querySelectorAll('[data-i18n-placeholder]'),
		title: () => document.querySelector('title')
	};

	let state = {
		translations: {},
		defaultLang: 'en',
		currentLang: 'en'
	};

	function getNested(obj, path) {
		return path.split('.').reduce((acc, key) => acc && acc[key], obj);
	}

	function apply(lang) {
		const dict = state.translations[lang] || state.translations[state.defaultLang] || {};

		// Update text nodes
		elements.textNodes().forEach(node => {
			const key = node.getAttribute('data-i18n');
			const val = getNested(dict, key);
			if (typeof val === 'string') node.textContent = val;
		});

		// Update placeholders
		elements.placeholders().forEach(input => {
			const key = input.getAttribute('data-i18n-placeholder');
			const val = getNested(dict, key);
			if (typeof val === 'string') input.placeholder = val;
		});

		// Update <title>
		const titleVal = getNested(dict, 'meta.title');
		if (typeof titleVal === 'string' && elements.title()) {
			elements.title().textContent = titleVal;
		}

		// Persist and set <html lang>
		state.currentLang = lang;
		localStorage.setItem('lang', lang);
		document.documentElement.setAttribute('lang', lang);
	}

	function detectPreferredLang(available) {
		const saved = localStorage.getItem('lang');
		if (saved && available.includes(saved)) return saved;
		const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
		const code = nav.toLowerCase().slice(0, 2);
		return available.includes(code) ? code : 'en';
	}

	function createSelector({ target, languages }) {
		const container = typeof target === 'string' ? document.querySelector(target) : target;
		if (!container) return null;
		const sel = document.createElement('select');
		sel.id = 'lang';
		languages.forEach(({ code, label }) => {
			const opt = document.createElement('option');
			opt.value = code; opt.textContent = label; sel.appendChild(opt);
		});
		container.appendChild(sel);
		sel.addEventListener('change', e => apply(e.target.value));
		return sel;
	}

	return {
		init({ translations, defaultLang = 'en', selectorTarget, languages }) {
			state.translations = translations;
			state.defaultLang = defaultLang;
			const available = Object.keys(translations);
			const lang = detectPreferredLang(available);
			if (selectorTarget && languages) {
				const sel = createSelector({ target: selectorTarget, languages });
				if (sel) sel.value = lang;
			}
			apply(lang);
		},
		apply,
		get current() { return state.currentLang; }
	};
})();

window.I18n = I18n;


