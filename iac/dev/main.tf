locals {
  environment = "dev"
  location    = "eastus2"
}

resource "random_integer" "suffix" {
  min = 10000
  max = 99999
}

resource "azurerm_resource_group" "tfstate" {
  name     = "mat-iq-tfstate-${local.environment}-eus2"
  location = local.location
}

resource "azurerm_storage_account" "tfstate" {
  name                     = "matiqtfstate${local.environment}${random_integer.suffix.result}"
  resource_group_name      = azurerm_resource_group.tfstate.name
  location                 = azurerm_resource_group.tfstate.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "tfstate" {
  name               = "tfstate"
  storage_account_id = azurerm_storage_account.tfstate.id
}