class PasswordEntry < ApplicationRecord
  belongs_to :user
  encrypts :password
end
