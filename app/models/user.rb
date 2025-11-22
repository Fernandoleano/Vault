class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy
  has_many :password_entries, dependent: :destroy

  normalizes :email_address, with: ->(e) { e.strip.downcase }

  # Validations
  validates :email_address, presence: true, uniqueness: true,
            format: { with: URI::MailTo::EMAIL_REGEXP, message: "must be a valid email address" }
  validates :password, length: { minimum: 8 }, allow_nil: true

  # Password reset token (Rails 8 built-in)
  generates_token_for :password_reset, expires_in: 15.minutes do
    password_salt&.last(10)
  end

  # API token for Chrome extension (non-expiring for convenience)
  generates_token_for :api_access

  # Class method to find user by password reset token
  def self.find_by_password_reset_token!(token)
    find_by_token_for!(:password_reset, token)
  end

  # Find user by API token
  def self.find_by_api_token(token)
    find_by_token_for(:api_access, token)
  end

  # Generate and return API token
  def generate_api_token!
    generate_token_for(:api_access)
  end

  # Invalidate API token (regenerate to invalidate old one)
  def invalidate_api_token!
    # Touch updated_at to invalidate existing tokens
    touch
  end

  # Instance method for token expiration time (used in mailer views)
  def password_reset_token
    generate_token_for(:password_reset)
  end

  def password_reset_token_expires_in
    15.minutes
  end
end
