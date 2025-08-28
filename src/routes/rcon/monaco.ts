import * as monaco from 'monaco-editor'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'

self.MonacoEnvironment = {
	getWorker: function () {
		return new jsonWorker()
	},
	// getWorker: function (_: string, label: string) {
	// 	return jsonWorker()
	// 	switch (label) {
	// 		case 'json':
	// 			return new jsonWorker()
	// 		default:
	// 			return new editorWorker()
	// 	}
	// },
}

export default monaco
