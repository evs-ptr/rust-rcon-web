export class CommandHistory {
	public readonly commands: string[] = $state([])
	public pos: number = $state(-1)
	public wip: string = $state('')

	add(command: string) {
		if (!command.trim()) {
			return
		}

		if (this.commands.length == 0 || this.commands[0] !== command) {
			this.commands.unshift(command)
			if (this.commands.length > 100) {
				this.commands.pop()
			}
		}

		this.resetPosition()
	}

	resetPosition() {
		this.pos = -1
		this.wip = ''
	}
}
