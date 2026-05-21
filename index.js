try {
	process.env.LESSONS = process.env.LESSONS ?? 1;

	const headers = {
		"Content-Type": "application/json",
		Authorization: `Bearer ${process.env.DUOLINGO_JWT}`,
		"user-agent":
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
	};

	// Helper to handle response validation
	const handleResponse = async (res) => {
		if (!res.ok) {
			const text = await res.text();
			throw new Error(`HTTP ${res.status}: ${text}`);
		}
		return res.json();
	};

	const { sub } = await fetch(
		`https://www.duolingo.com/2017-06-30/users/${process.env.DUOLINGO_JWT.split(".")[1] ? 'me' : 'invalid'}`, 
		{ headers }
	).then(handleResponse);

	const { fromLanguage, learningLanguage } = await fetch(
		`https://www.duolingo.com/2017-06-30/users/${sub}?fields=fromLanguage,learningLanguage`,
		{ headers },
	).then(handleResponse);

	let xp = 0;
	for (let i = 0; i < process.env.LESSONS; i++) {
		const session = await fetch(
			"https://www.duolingo.com/2017-06-30/sessions",
			{
				body: JSON.stringify({
					challengeTypes: ["assist", "characterIntro", "characterMatch", "characterPuzzle", "characterSelect", "characterTrace", "characterWrite", "completeReverseTranslation", "definition", "dialogue", "extendedMatch", "extendedListenMatch", "form", "freeResponse", "gapFill", "judge", "listen", "listenComplete", "listenMatch", "match", "name", "listenComprehension", "listenIsolation", "listenSpeak", "listenTap", "orderTapComplete", "partialListen", "partialReverseTranslate", "patternTapComplete", "radioBinary", "radioImageSelect", "radioListenMatch", "radioListenRecognize", "radioSelect", "readComprehension", "reverseAssist", "sameDifferent", "select", "selectPronunciation", "selectTranscription", "svgPuzzle", "syllableTap", "syllableListenTap", "speak", "tapCloze", "tapClozeTable", "tapComplete", "tapCompleteTable", "tapDescribe", "translate", "transliterate", "transliterationAssist", "typeCloze", "typeClozeTable", "typeComplete", "typeCompleteTable", "writeComprehension"],
					fromLanguage,
					isFinalLevel: false,
					isV2: true,
					juicy: true,
					learningLanguage,
					smartTipsVersion: 2,
					type: "GLOBAL_PRACTICE",
				}),
				headers,
				method: "POST",
			},
		).then(handleResponse);

		const response = await fetch(
			`https://www.duolingo.com/2017-06-30/sessions/${session.id}`,
			{
				body: JSON.stringify({
					...session,
					heartsLeft: 0,
					startTime: (+new Date() - 60000) / 1000,
					enableBonusPoints: false,
					endTime: +new Date() / 1000,
					failed: false,
					maxInLessonStreak: 9,
					shouldLearnThings: true,
				}),
				headers,
				method: "PUT",
			},
		).then(handleResponse);

		xp += response.xpGain;
	}

	console.log(`🎉 You won ${xp} XP`);
} catch (error) {
	console.log("❌ Something went wrong");
	console.error(error.message); // This will print the actual error from the server
}
