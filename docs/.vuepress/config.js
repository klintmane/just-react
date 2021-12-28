module.exports = {
	"title": "Secrets of React technology",
	"description": "React source code analysis",
	"dest": "dist",
	"serviceWorker": false,
	"head": [
		["script", { "src": "/assets/js/tj.js" }]
	],
	"configureWebpack": {
		"resolve": {
			"alias": {}
		}
	},
	"markdown": {},
	"themeConfig": {
		"repo": "BetaSu/just-react",
		"repoLabel": "Light up⭐ Don't get lost",
		"editLinks": true,
		"docsDir": "docs",
		"editLinkText": "Correction for this chapter",
		"lastUpdated": "Last update",
		"nav": [
			{
				"text": "🙋‍♂️ grow together",
				"link": "/me"
			},
			{
				"text": "🔥 Video course",
				"link": "https://ke.segmentfault.com/course/1650000023864436"
			},
			{
				"text": "Vue technology revealed",
				"link": "https://ustbhuangyi.github.io/vue-analysis/"
			},
		],
		"sidebar": [
			[
				"/",
				"Preface"
			],
			{
				"title": "Ideas",
				"collapsable": true,
				"children": [
					{
						"title": "Chapter 1 React Concept",
						"children": [
							[
								"/preparation/idea",
								"React philosophy"
							],
							[
								"/preparation/oldConstructure",
								"Old React architecture"
							],
							[
								"/preparation/newConstructure",
								"New React architecture"
							],
							[
								"/process/fiber-mental",
								"The mental model of Fiber architecture"
							],
							[
								"/process/fiber",
								"The realization principle of Fiber architecture"
							],
							[
								"/process/doubleBuffer",
								"How the Fiber architecture works"
							],
							[
								"/preparation/summary",
								"Summarize"
							]
						]
					},
					{
						"title": "Chapter 2 Pre-Knowledge",
						"children": [
							[
								"/preparation/file",
								"The file structure of the source code"
							],
							[
								"/preparation/source",
								"Debug source code"
							],
							[
								"/preparation/jsx",
								"Deep understanding of JSX"
							]
						]
					}
				]
			},
			{
				"title": "Architecture",
				"collapsable": true,
				"children": [
					{
						"title": "Chapter 3 Render Phase",
						"children": [
							[
								"/process/reconciler",
								"Process overview"
							],
							[
								"/process/beginWork",
								"beginWork"
							],
							[
								"/process/completeWork",
								"completeWork"
							]
						]
					},
					{
						"title": "Chapter 4 commit stage",
						"children": [
							[
								"/renderer/prepare",
								"Process overview"
							],
							[
								"/renderer/beforeMutation",
								"before mutation stage"
							],
							[
								"/renderer/mutation",
								"mutation stage"
							],
							[
								"/renderer/layout",
								"layout stage"
							]
						]
					}
				]
			},
			{
				"title": "Implementation",
				"collapsable": true,
				"children": [
					{
						"title": "Chapter 5 Diff Algorithm",
						"children": [
							[
								"/diff/prepare",
								"Overview"
							],
							[
								"/diff/one",
								"Single node Diff"
							],
							[
								"/diff/multi",
								"Multi-node Diff"
							]
						]
					},
					{
						"title": "Chapter 6 Status Update",
						"children": [
							[
								"/state/prepare",
								"Process overview"
							],
							[
								"/state/mental",
								"Mental model"
							],
							[
								"/state/update",
								"Update"
							],
							[
								"/state/priority",
								"In-depth understanding of priorities"
							],
							[
								"/state/reactdom",
								"ReactDOM.render"
							],
							[
								"/state/setstate",
								"this.setState"
							]
						]
					},
					{
						"title": "Chapter 7 Hooks",
						"children": [
							[
								"/hooks/prepare",
								"Hooks concept"
							],
							[
								"/hooks/create",
								"Minimal Hooks implementation"
							],
							[
								"/hooks/structure",
								"Hooks data structure"
							],
							[
								"/hooks/usestate",
								"useState & useReducer"
							],
							[
								"/hooks/useeffect",
								"useEffect"
							],
							[
								"/hooks/useref",
								"useRef"
							],
							[
								"/hooks/usememo",
								"useMemo & useCallback"
							],
						]
					},
					{
						"title": "Chapter 8 Concurrent Mode",
						"children": [
							[
								"/concurrent/prepare",
								"Overview"
							],
							[
								"/concurrent/scheduler",
								"Principle and implementation of Scheduler"
							],
							[
								"/concurrent/lane",
								"lane model"
							],
							[
								"/concurrent/disrupt",
								"Asynchronous interruptible update"
							]
						]
					}
				]
			},
		]
	},
	"base": ""
}