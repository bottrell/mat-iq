# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`mat-iq` is an Azure-hosted project. At present the repository contains only infrastructure-as-code (Terraform) targeting Azure. Application code has not yet been added.

## Infrastructure (iac/)

Terraform configuration targeting Azure (`azurerm ~>4.0`, `random ~>3.0`). Environment directories live under `iac/` (e.g. `iac/dev/`).

### Bootstrap remote state

Before running Terraform for a new environment, create the Azure Storage backend:

```bash
cd iac
bash initialize.sh <environment>   # e.g. bash initialize.sh dev
```

This creates a resource group (`mat-iq-tfstate-<env>-eus2`), a storage account, and a blob container named `tfstate` in `eastus2`.

### Terraform workflow

```bash
cd iac/<environment>
terraform init
terraform plan
terraform apply
```

Authentication uses `az login` (Azure CLI). Ensure the correct subscription is set before running Terraform.