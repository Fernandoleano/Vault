require 'bundler/setup'
begin
  Bundler.require(:default, :development)
  puts "Success"
rescue Exception => e
  puts e.class
  puts e.message
  puts e.backtrace
end
