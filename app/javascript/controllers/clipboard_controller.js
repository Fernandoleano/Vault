import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
    static targets = ["source", "button", "icon"]
    static values = {
        successDuration: { type: Number, default: 2000 }
    }

    connect() {
        this.originalIcon = this.iconTarget.innerHTML
    }

    copy(event) {
        event.preventDefault()
        const text = this.sourceTarget.value || this.sourceTarget.innerText

        navigator.clipboard.writeText(text).then(() => {
            this.copied()
        })
    }

    copied() {
        this.iconTarget.innerHTML = `
      <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
    `

        setTimeout(() => {
            this.iconTarget.innerHTML = this.originalIcon
        }, this.successDurationValue)
    }
}
