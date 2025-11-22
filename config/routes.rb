Rails.application.routes.draw do
  puts "LOADING ROUTES FILE..."
  resource :session
  resource :registration, only: %i[new create]
  resources :passwords, param: :token
  resources :credentials

  # API for Chrome extension
  namespace :api do
    namespace :v1 do
      post "auth/login", to: "auth#login"
      delete "auth/logout", to: "auth#logout"
      resources :credentials, only: [:index, :show] do
        collection do
          get :search
          get :for_url
        end
      end
    end
  end

  get "up" => "rails/health#show", as: :rails_health_check

  root "credentials#index"
end
