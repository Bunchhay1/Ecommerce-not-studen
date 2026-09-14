package dto

type UpdatePreferencesRequest struct {
	Language           *string `json:"language,omitempty" binding:"omitempty,max=10"`
	Currency           *string `json:"currency,omitempty" binding:"omitempty,max=10"`
	EmailNotifications *bool   `json:"email_notifications,omitempty"`
	SMSNotifications   *bool   `json:"sms_notifications,omitempty"`
	PushNotifications  *bool   `json:"push_notifications,omitempty"`
}

type PreferencesResponse struct {
	UserID             string `json:"user_id"`
	Language           string `json:"language"`
	Currency           string `json:"currency"`
	EmailNotifications bool   `json:"email_notifications"`
	SMSNotifications   bool   `json:"sms_notifications"`
	PushNotifications  bool   `json:"push_notifications"`
}

type UpdateSettingsRequest struct {
	Theme            *string `json:"theme,omitempty" binding:"omitempty,oneof=light dark system"`
	TwoFactorEnabled *bool   `json:"two_factor_enabled,omitempty"`
	MarketingOptIn   *bool   `json:"marketing_opt_in,omitempty"`
}

type SettingsResponse struct {
	UserID           string `json:"user_id"`
	Theme            string `json:"theme"`
	TwoFactorEnabled bool   `json:"two_factor_enabled"`
	MarketingOptIn   bool   `json:"marketing_opt_in"`
}
