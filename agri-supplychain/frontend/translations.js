// Common translations for EN, HI, TE, KN
// Extend per-page keys as needed
const translations = {
	en: {
		meta: { title: "AgriChain" },
		brand: "AgriChain",
		lang: { label: "Language" },
		nav: {
			farmerPortal: "AgriChain - Farmer Portal",
			customerPortal: "AgriChain - Customer Portal",
			officerPortal: "AgriChain - Officer Portal"
		},
		auth: {
			tagline: "Connecting Farmers, Officers & Customers",
			welcomeTitle: "Welcome to Agricultural Supply Chain",
			welcomeSubtitle: "Choose your role to continue",
			roles: {
				farmer: { title: "Farmer", desc: "Sell your crops directly to customers or through Agricultural Verification Officers" },
				officer: { title: "Agricultural Verification Officer", desc: "Verify crops, analyze quality, set prices, and manage the supply chain" },
				customer: { title: "Customer", desc: "Buy fresh, verified crops from farmers or Agricultural Verification Officers" }
			},
			common: { back: "Back", login: "Login", register: "Register" }
		},
		farmer: {
			welcomeTitle: "Welcome to Your Farmer Dashboard",
			welcomeSubtitle: "Manage your crops, set prices, and connect with Agricultural Verification Officers",
			cards: {
				directSelling: { title: "Direct Selling", desc: "Set prices for your crops and sell directly to customers" },
				officer: { title: "Contact Agricultural Verification Officer", desc: "Get your crops verified, analyzed, and sold through officers" }
			}
		},
		customer: {
			welcomeTitle: "Welcome to Your Customer Dashboard",
			welcomeSubtitle: "Buy fresh, verified crops directly from farmers or Agricultural Verification Officers",
			cards: {
				buyFarmers: { title: "Buy from Farmers", desc: "Purchase crops directly from farmers at fixed prices" },
				buyOfficers: { title: "Buy from Officers", desc: "Purchase verified, quality-assured crops from Agricultural Verification Officers" }
			}
		},
		officer: {
			welcomeTitle: "Agricultural Verification Officer Dashboard",
			welcomeSubtitle: "Verify crops, analyze quality, set prices, and manage the agricultural supply chain",
			cards: {
				verify: { title: "Verification & Pricing", desc: "Verify crops and set prices in one flow" },
				sales: { title: "Sales Management", desc: "Sell verified crops to customers and manage sales transactions" }
			}
		}
	},
	hi: {
		meta: { title: "एग्रीचेन" },
		brand: "एग्रीचेन",
		lang: { label: "भाषा" },
		nav: {
			farmerPortal: "एग्रीचेन - किसान पोर्टल",
			customerPortal: "एग्रीचेन - ग्राहक पोर्टल",
			officerPortal: "एग्रीचेन - अधिकारी पोर्टल"
		},
		auth: {
			tagline: "किसानों, अधिकारियों और ग्राहकों को जोड़ना",
			welcomeTitle: "कृषि आपूर्ति श्रृंखला में आपका स्वागत है",
			welcomeSubtitle: "जारी रखने के लिए अपनी भूमिका चुनें",
			roles: {
				farmer: { title: "किसान", desc: "अपनी फसल सीधे ग्राहकों या कृषि सत्यापन अधिकारियों के माध्यम से बेचें" },
				officer: { title: "कृषि सत्यापन अधिकारी", desc: "फसल सत्यापित करें, गुणवत्ता विश्लेषण करें, कीमत तय करें और आपूर्ति श्रृंखला प्रबंधित करें" },
				customer: { title: "ग्राहक", desc: "किसानों या कृषि सत्यापन अधिकारियों से ताजी, प्रमाणित फसलें खरीदें" }
			},
			common: { back: "वापस", login: "लॉगिन", register: "रजिस्टर" }
		},
		farmer: {
			welcomeTitle: "आपके किसान डैशबोर्ड में स्वागत है",
			welcomeSubtitle: "अपनी फसलें प्रबंधित करें, कीमतें तय करें और अधिकारियों से जुड़ें",
			cards: {
				directSelling: { title: "प्रत्यक्ष बिक्री", desc: "अपनी फसलों की कीमत तय करें और सीधे ग्राहकों को बेचें" },
				officer: { title: "कृषि सत्यापन अधिकारी से संपर्क करें", desc: "अपनी फसलों को सत्यापित, विश्लेषित और अधिकारियों के माध्यम से बेचें" }
			}
		},
		customer: {
			welcomeTitle: "आपके ग्राहक डैशबोर्ड में स्वागत है",
			welcomeSubtitle: "किसानों या कृषि सत्यापन अधिकारियों से ताजी, प्रमाणित फसलें खरीदें",
			cards: {
				buyFarmers: { title: "किसानों से खरीदें", desc: "किसानों से सीधे फसलें निश्चित कीमतों पर खरीदें" },
				buyOfficers: { title: "अधिकारियों से खरीदें", desc: "कृषि सत्यापन अधिकारियों से प्रमाणित, गुणवत्ता वाली फसलें खरीदें" }
			}
		},
		officer: {
			welcomeTitle: "कृषि सत्यापन अधिकारी डैशबोर्ड",
			welcomeSubtitle: "फसलें सत्यापित करें, गुणवत्ता विश्लेषित करें, कीमत तय करें और आपूर्ति श्रृंखला प्रबंधित करें",
			cards: {
				verify: { title: "सत्यापन और मूल्य निर्धारण", desc: "एक ही प्रवाह में फसल सत्यापित करें और कीमत तय करें" },
				sales: { title: "विक्रय प्रबंधन", desc: "प्रमाणित फसलें ग्राहकों को बेचें और लेनदेन प्रबंधित करें" }
			}
		}
	},
	te: {
		meta: { title: "అగ్రిచెయిన్" },
		brand: "అగ్రిచెయిన్",
		lang: { label: "భాష" },
		nav: {
			farmerPortal: "అగ్రిచెయిన్ - రైతు పోర్టల్",
			customerPortal: "అగ్రిచెయిన్ - కస్టమర్ పోర్టల్",
			officerPortal: "అగ్రిచెయిన్ - అధికారి పోర్టల్"
		},
		auth: {
			tagline: "రైతులు, అధికారులు మరియు కస్టమర్లను కలపడం",
			welcomeTitle: "వ్యవసాయ సరఫరా గొలుసుకు స్వాగతం",
			welcomeSubtitle: "కొనసాగేందుకు మీ పాత్రను ఎంచుకోండి",
			roles: {
				farmer: { title: "రైతు", desc: "మీ పంటలను నేరుగా కస్టమర్లకు లేదా వ్యవసాయ ధృవీకరణ అధికారుల ద్వారా అమ్మండి" },
				officer: { title: "వ్యవసాయ ధృవీకరణ అధికారి", desc: "పంటలను ధృవీకరించండి, నాణ్యత విశ్లేషించండి, ధరలను నిర్ణయించండి మరియు సరఫరా గొలుసును నిర్వహించండి" },
				customer: { title: "కస్టమర్", desc: "రైతుల నుంచి లేదా వ్యవసాయ ధృవీకరణ అధికారుల నుంచి తాజా, ధృవీకరించిన పంటలను కొనండి" }
			},
			common: { back: "వెనుకకు", login: "లాగిన్", register: "రిజిస్టర్" }
		},
		farmer: {
			welcomeTitle: "మీ రైతు డ్యాష్‌బోర్డుకు స్వాగతం",
			welcomeSubtitle: "మీ పంటలను నిర్వహించండి, ధరలను నిర్ణయించండి మరియు అధికారులతో కనెక్ట్ అవ్వండి",
			cards: {
				directSelling: { title: "నేరుగా అమ్మకం", desc: "మీ పంటల ధరలను సెట్ చేసి నేరుగా కస్టమర్లకు అమ్మండి" },
				officer: { title: "వ్యవసాయ ధృవీకరణ అధికారి సంప్రదించండి", desc: "మీ పంటలను ధృవీకరించి, విశ్లేషించి, అధికారుల ద్వారా అమ్మండి" }
			}
		},
		customer: {
			welcomeTitle: "మీ కస్టమర్ డ్యాష్‌బోర్డుకు స్వాగతం",
			welcomeSubtitle: "రైతుల నుంచి లేదా అధికారుల నుంచి తాజా, ధృవీకరించిన పంటలను కొనండి",
			cards: {
				buyFarmers: { title: "రైతుల నుంచి కొనండి", desc: "రైతుల నుంచి నేరుగా స్థిర ధరల వద్ద పంటలను కొనండి" },
				buyOfficers: { title: "అధికారుల నుంచి కొనండి", desc: "వ్యవసాయ అధికారుల నుంచి ధృవీకరించిన, నాణ్యమైన పంటలను కొనండి" }
			}
		},
		officer: {
			welcomeTitle: "వ్యవసాయ ధృవీకరణ అధికారి డ్యాష్‌బోర్డు",
			welcomeSubtitle: "పంటలను ధృవీకరించండి, నాణ్యత విశ్లేషించండి, ధరలను నిర్ణయించండి మరియు సరఫరా గొలుసును నిర్వహించండి",
			cards: {
				verify: { title: "ధృవీకరణ & ధరలు", desc: "ఒకే ప్రవాహంలో పంటలను ధృవీకరించి ధరలను నిర్ణయించండి" },
				sales: { title: "అమ్మకాల నిర్వహణ", desc: "ధృవీకరించిన పంటలను కస్టమర్లకు అమ్మండి మరియు లావాదేవీలను నిర్వహించండి" }
			}
		}
	},
	kn: {
		meta: { title: "ಅಗ್ರಿಚೈನ್" },
		brand: "ಅಗ್ರಿಚೈನ್",
		lang: { label: "ಭಾಷೆ" },
		nav: {
			farmerPortal: "ಅಗ್ರಿಚೈನ್ - ರೈತ ಪೋರ್ಟಲ್",
			customerPortal: "ಅಗ್ರಿಚೈನ್ - ಗ್ರಾಹಕ ಪೋರ್ಟಲ್",
			officerPortal: "ಅಗ್ರಿಚೈನ್ - ಅಧಿಕಾರಿ ಪೋರ್ಟಲ್"
		},
		auth: {
			tagline: "ರೈತರು, ಅಧಿಕಾರಿಗಳು ಮತ್ತು ಗ್ರಾಹಕರನ್ನು ಸಂಪರ್ಕಿಸುವುದು",
			welcomeTitle: "ಕೃಷಿ ಸರಬರಾಜು ಸರಪಳಿಗೆ ಸ್ವಾಗತ",
			welcomeSubtitle: "ಮುಂದುವರಿಸಲು ನಿಮ್ಮ ಪಾತ್ರವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
			roles: {
				farmer: { title: "ರೈತ", desc: "ನಿಮ್ಮ ಬೆಳೆಗಳನ್ನು ನೇರವಾಗಿ ಗ್ರಾಹಕರಿಗೆ ಅಥವಾ ಕೃಷಿ ಪರಿಶೀಲನಾ ಅಧಿಕಾರಿಗಳ ಮೂಲಕ ಮಾರಾಟಿಸಿ" },
				officer: { title: "ಕೃಷಿ ಪರಿಶೀಲನಾ ಅಧಿಕಾರಿ", desc: "ಬೆಳೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ಗುಣಮಟ್ಟ ವಿಶ್ಲೇಷಿಸಿ, ಬೆಲೆ ನಿಗದಿ ಮಾಡಿ ಮತ್ತು ಸರಬರಾಜು ಸರಪಳಿಯನ್ನು ನಿರ್ವಹಿಸಿ" },
				customer: { title: "ಗ್ರಾಹಕ", desc: "ರೈತರಿಂದ ಅಥವಾ ಕೃಷಿ ಪರಿಶೀಲನಾ ಅಧಿಕಾರಿಗಳಿಂದ ತಾಜಾ, ಪ್ರಮಾಣಿತ ಬೆಳೆಗಳನ್ನು ಖರೀದಿಸಿ" }
			},
			common: { back: "ಹಿಂದಕ್ಕೆ", login: "ಲಾಗಿನ್", register: "ನೋಂದಣಿ" }
		},
		farmer: {
			welcomeTitle: "ನಿಮ್ಮ ರೈತ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಸ್ವಾಗತ",
			welcomeSubtitle: "ನಿಮ್ಮ ಬೆಳೆಗಳನ್ನು ನಿರ್ವಹಿಸಿ, ಬೆಲೆ ನಿಗದಿ ಮಾಡಿ ಮತ್ತು ಅಧಿಕಾರಿಗಳೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಿ",
			cards: {
				directSelling: { title: "ನೇರ ಮಾರಾಟ", desc: "ನಿಮ್ಮ ಬೆಳೆಗಳಿಗೆ ಬೆಲೆ ನಿಗದಿ ಮಾಡಿ ಮತ್ತು ನೇರವಾಗಿ ಗ್ರಾಹಕರಿಗೆ ಮಾರಾಟಿಸಿ" },
				officer: { title: "ಕೃಷಿ ಪರಿಶೀಲನಾ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ", desc: "ನಿಮ್ಮ ಬೆಳೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ವಿಶ್ಲೇಷಿಸಿ ಮತ್ತು ಅಧಿಕಾರಿಗಳ ಮೂಲಕ ಮಾರಾಟಿಸಿ" }
			}
		},
		customer: {
			welcomeTitle: "ನಿಮ್ಮ ಗ್ರಾಹಕ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಸ್ವಾಗತ",
			welcomeSubtitle: "ರೈತರಿಂದ ಅಥವಾ ಅಧಿಕಾರಿಗಳಿಂದ ತಾಜಾ, ಪ್ರಮಾಣಿತ ಬೆಳೆಗಳನ್ನು ಖರೀದಿಸಿ",
			cards: {
				buyFarmers: { title: "ರೈತರಿಂದ ಖರೀದಿ", desc: "ರೈತರಿಂದ ನೇರವಾಗಿ ನಿಗದಿತ ಬೆಲೆಗಳಲ್ಲಿ ಬೆಳೆಗಳನ್ನು ಖರೀದಿಸಿ" },
				buyOfficers: { title: "ಅಧಿಕಾರಿಯಿಂದ ಖರೀದಿ", desc: "ಕೃಷಿ ಅಧಿಕಾರಿಯಿಂದ ಪ್ರಮಾಣಿತ, ಗುಣಮಟ್ಟದ ಬೆಳೆಗಳನ್ನು ಖರೀದಿಸಿ" }
			}
		},
		officer: {
			welcomeTitle: "ಕೃಷಿ ಪರಿಶೀಲನಾ ಅಧಿಕಾರಿ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
			welcomeSubtitle: "ಬೆಳೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ, ಗುಣಮಟ್ಟ ವಿಶ್ಲೇಷಿಸಿ, ಬೆಲೆ ನಿಗದಿ ಮಾಡಿ ಮತ್ತು ಸರಬರಾಜು ಸರಪಳಿಯನ್ನು ನಿರ್ವಹಿಸಿ",
			cards: {
				verify: { title: "ಪರಿಶೀಲನೆ ಮತ್ತು ಬೆಲೆ", desc: "ಒಂದೇ ಹಾದಿಯಲ್ಲಿ ಬೆಳೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಬೆಲೆ ನಿಗದಿ ಮಾಡಿ" },
				sales: { title: "ಮಾರಾಟ ನಿರ್ವಹಣೆ", desc: "ಪ್ರಮಾಣಿತ ಬೆಳೆಗಳನ್ನು ಗ್ರಾಹಕರಿಗೆ ಮಾರಾಟಿಸಿ ಮತ್ತು ವಹಿವಾಟುಗಳನ್ನು ನಿರ್ವಹಿಸಿ" }
			}
		}
	}
};

// Expose for I18n.init
window.translations = translations;


