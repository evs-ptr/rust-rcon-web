export class RustServer {
	private static idCounter = 0

	public readonly id: number
	public ipPort: string = $state('')
	public password: string = $state('')

	constructor() {
		this.id = RustServer.idCounter++
	}
}
