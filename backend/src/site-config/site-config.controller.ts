import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { AdminGuard } from '../common/guards/admin.guard'
import { SiteConfigService } from './site-config.service'

@Controller('site-config')
export class SiteConfigController {
  constructor(private siteConfig: SiteConfigService) {}

  @Get()
  getConfig() {
    return this.siteConfig.getConfig()
  }

  @Patch()
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateConfig(@Body() body: {
    fontFamily?:    string
    fontSize?:      number
    fontWeight?:    string
    fontStyle?:     string
    siteTitle?:     string
    siteMotto?:     string
    buttons?:       any[]
    colorGold?:     string
    colorText?:     string
    colorBg?:       string
    colorMuted?:    string
    footerTagline?: string
    footerNote?:    string
    footerColumns?: any[]
    textStyles?:               any
    productAccordions?:        any[]
    homepageSections?:         any[]
    sizeGuideContactText?:     string
    sizeGuideContactLinkText?: string
    sizeGuideContactLinkUrl?:  string
    shippingCost?:             number
    taxRate?:                  number
    taxLabel?:                 string
    whatsappNumber?:           string
    whatsappMessageTemplate?:  string
    whatsappImageUrl?:         string
    invoiceEmailSubject?:      string
    invoiceEmailBody?:         string
    faviconUrl?:               string
    ogImageUrl?:               string
    invoiceLogoUrl?:           string
    invoiceCompanyName?:       string
    invoiceCompanyAddress?:    string
    invoiceFooterText?:        string
  }) {
    return this.siteConfig.updateConfig(body)
  }
}
