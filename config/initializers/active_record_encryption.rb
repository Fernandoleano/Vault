# Active Record Encryption configuration
# These keys are for development only - production should use Rails credentials
Rails.application.config.active_record.encryption.primary_key = ENV.fetch("ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY", "Z2uQc7cgzBXF7FMy082vcz7xA7H27R1t")
Rails.application.config.active_record.encryption.deterministic_key = ENV.fetch("ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY", "LfsAea7aboezFVBEuT474SpalFMVbQwa")
Rails.application.config.active_record.encryption.key_derivation_salt = ENV.fetch("ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT", "ub0ZbZcAHbJRyFvKVHGttVF99p11xlro")
