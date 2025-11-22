import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.isProcessing = false
  }

  delete(event) {
    event.preventDefault()
    event.stopPropagation()
    event.stopImmediatePropagation()

    // Prevent double-clicks
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true

    // Get URL directly from the data attribute on the element
    const deleteUrl = this.element.getAttribute('data-url')
    console.log("Delete URL:", deleteUrl)

    if (!deleteUrl) {
      console.error("No delete URL found!")
      this.isProcessing = false
      return
    }

    // Perform the delete
    this.performDelete(deleteUrl)
  }

  performDelete(url) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content

    fetch(url, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': csrfToken,
        'Accept': 'application/json, text/html',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin'
    })
    .then(response => {
      if (response.ok) {
        // Find the credential card (parent container with rounded-2xl class) and remove it with animation
        const card = this.element.closest('[class*="rounded-2xl"]')
        if (card) {
          card.style.transition = 'all 0.3s ease'
          card.style.transform = 'scale(0.9)'
          card.style.opacity = '0'
          setTimeout(() => {
            card.remove()
            // Check if there are no more credentials and show empty state
            const grid = document.querySelector('.grid')
            if (grid && grid.children.length === 0) {
              window.location.reload()
            }
          }, 300)
        }
      } else {
        console.error("Delete failed with status:", response.status)
        this.isProcessing = false
      }
    })
    .catch(error => {
      console.error("Fetch error:", error)
      this.isProcessing = false
    })
  }
}
