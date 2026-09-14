package com.example.order.dto;

import com.example.order.entity.OrderAddress;
import com.example.order.enums.AddressType;
import jakarta.validation.constraints.NotBlank;

public class OrderAddressDto {

    private String id;
    private AddressType type = AddressType.SHIPPING;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Address line 1 is required")
    private String addressLine1;

    private String addressLine2;

    @NotBlank(message = "City is required")
    private String city;

    private String province;
    private String postalCode;

    @NotBlank(message = "Country is required")
    private String country;

    public OrderAddressDto() {
    }

    public static OrderAddressDto fromEntity(OrderAddress entity) {
        OrderAddressDto dto = new OrderAddressDto();
        dto.setId(entity.getId());
        dto.setType(entity.getType());
        dto.setFullName(entity.getFullName());
        dto.setPhone(entity.getPhone());
        dto.setAddressLine1(entity.getAddressLine1());
        dto.setAddressLine2(entity.getAddressLine2());
        dto.setCity(entity.getCity());
        dto.setProvince(entity.getProvince());
        dto.setPostalCode(entity.getPostalCode());
        dto.setCountry(entity.getCountry());
        return dto;
    }

    public OrderAddress toEntity() {
        return new OrderAddress(
                this.type,
                this.fullName,
                this.phone,
                this.addressLine1,
                this.addressLine2,
                this.city,
                this.province,
                this.postalCode,
                this.country
        );
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public AddressType getType() { return type; }
    public void setType(AddressType type) { this.type = type; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getAddressLine1() { return addressLine1; }
    public void setAddressLine1(String addressLine1) { this.addressLine1 = addressLine1; }

    public String getAddressLine2() { return addressLine2; }
    public void setAddressLine2(String addressLine2) { this.addressLine2 = addressLine2; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getProvince() { return province; }
    public void setProvince(String province) { this.province = province; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
}
