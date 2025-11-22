module Api
  module V1
    class CredentialsController < BaseController
      def index
        credentials = current_user.password_entries.order(created_at: :desc)
        render json: {
          credentials: credentials.map { |c| credential_json(c) }
        }
      end

      def show
        credential = current_user.password_entries.find(params[:id])
        render json: { credential: credential_json(credential) }
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Credential not found" }, status: :not_found
      end

      def search
        query = params[:q].to_s.downcase
        credentials = current_user.password_entries.where(
          "LOWER(title) LIKE :q OR LOWER(username) LIKE :q OR LOWER(url) LIKE :q",
          q: "%#{query}%"
        )
        render json: {
          credentials: credentials.map { |c| credential_json(c) }
        }
      end

      def for_url
        url = params[:url].to_s
        return render json: { credentials: [] } if url.blank?

        # Extract domain from URL
        domain = extract_domain(url)
        credentials = current_user.password_entries.where(
          "LOWER(url) LIKE :domain",
          domain: "%#{domain.downcase}%"
        )
        render json: {
          credentials: credentials.map { |c| credential_json(c) }
        }
      end

      private

      def credential_json(credential)
        {
          id: credential.id,
          title: credential.title,
          username: credential.username,
          password: credential.password,
          url: credential.url,
          created_at: credential.created_at,
          updated_at: credential.updated_at
        }
      end

      def extract_domain(url)
        uri = URI.parse(url)
        uri.host || url
      rescue URI::InvalidURIError
        url
      end
    end
  end
end
