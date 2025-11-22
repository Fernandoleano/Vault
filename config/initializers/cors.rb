# config/initializers/cors.rb
# Allow Chrome extension to communicate with the API

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # Allow requests from Chrome extensions and localhost
    origins(
      "chrome-extension://*",
      "http://localhost:3002",
      "http://127.0.0.1:3002"
    )

    resource "/api/*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      credentials: false,
      max_age: 86400
  end
end
