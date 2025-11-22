module Api
  module V1
    class AuthController < ActionController::API
      def login
        user = User.authenticate_by(email_address: params[:email], password: params[:password])

        if user
          token = user.generate_api_token!
          render json: {
            token: token,
            user: {
              id: user.id,
              email: user.email_address
            }
          }
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      def logout
        token = request.headers["Authorization"]&.split(" ")&.last
        if token
          user = User.find_by_api_token(token)
          user&.invalidate_api_token!
        end
        render json: { message: "Logged out successfully" }
      end
    end
  end
end
