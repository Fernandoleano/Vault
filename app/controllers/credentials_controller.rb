class CredentialsController < ApplicationController
  before_action :set_credential, only: %i[ edit update destroy ]

  def index
    @credentials = Current.user.password_entries.order(created_at: :desc)
  end

  def new
    @credential = Current.user.password_entries.new
  end

  def create
    @credential = Current.user.password_entries.new(credential_params)
    if @credential.save
      redirect_to credentials_path, notice: "Credential saved successfully."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @credential.update(credential_params)
      redirect_to credentials_path, notice: "Credential updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @credential.destroy
    redirect_to credentials_path, notice: "Credential deleted."
  end

  private

  def set_credential
    @credential = Current.user.password_entries.find(params[:id])
  end

  def credential_params
    params.require(:password_entry).permit(:title, :username, :password, :url)
  end
end
