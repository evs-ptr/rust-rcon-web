import { browser } from '$app/environment'

export function saveToStorage(key: string, obj: object): void {
	if (!browser) {
		return
	}

	try {
		const json = JSON.stringify(obj)
		localStorage.setItem(key, json)
	} catch (e) {
		console.error('Error while saveToStorage', e)
	}
}

export function getFromStorage<T extends object>(key: string): T | null {
	if (!browser) {
		return null
	}

	const json = localStorage.getItem(key)
	if (json === null) {
		return null
	}

	try {
		const obj = JSON.parse(json) as T
		return obj
	} catch (e) {
		console.error('Error while parsing json getFromStorage', e)
	}

	return null
}

export function deleteFromStorage(key: string) {
	if (!browser) {
		return
	}

	localStorage.removeItem(key)
}

export function getAllKeys(): string[] {
	if (!browser) {
		return []
	}

	const keys: string[] = []

	for (let i = 0; i < localStorage.length; i++) {
		const key = localStorage.key(i)
		if (key) {
			keys.push(key)
		}
	}

	return keys
}
