module Api
  module V1
    class BaseController < ActionController::API
      before_action :authenticate_token!

      private

      def authenticate_token!
        token = request.headers["Authorization"]&.split(" ")&.last
        return render_unauthorized unless token

        @current_user = User.find_by_api_token(token)
        render_unauthorized unless @current_user
      end

      def current_user
        @current_user
      end

      def render_unauthorized
        render json: { error: "Unauthorized" }, status: :unauthorized
      end

      def render_error(message, status: :unprocessable_entity)
        render json: { error: message }, status: status
      end
    end
  end
end
