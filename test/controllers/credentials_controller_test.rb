require "test_helper"

class CredentialsControllerTest < ActionDispatch::IntegrationTest
  test "should get index" do
    get credentials_index_url
    assert_response :success
  end

  test "should get new" do
    get credentials_new_url
    assert_response :success
  end

  test "should get create" do
    get credentials_create_url
    assert_response :success
  end

  test "should get edit" do
    get credentials_edit_url
    assert_response :success
  end

  test "should get update" do
    get credentials_update_url
    assert_response :success
  end

  test "should get destroy" do
    get credentials_destroy_url
    assert_response :success
  end
end
