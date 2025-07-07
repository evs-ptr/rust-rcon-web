export class RustServer {
	private static idCounter = 0

	public readonly id: number
	public ipPort: string = ''
	public password: string = ''

	constructor() {
		this.id = RustServer.idCounter++
	}
}
