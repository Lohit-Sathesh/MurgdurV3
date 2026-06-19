import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './database/database.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { ProductsModule } from './products/products.module'
import { SearchModule } from './search/search.module'
import { OrdersModule } from './orders/orders.module'
import { WishlistModule } from './wishlist/wishlist.module'
import { MediaModule } from './media/media.module'
import { JobsModule } from './jobs/jobs.module'
import { PaymentModule } from './payments/payment.module'
import { AdminModule } from './admin/admin.module'
import { HealthModule } from './health/health.module'
import { HomepageModule } from './homepage/homepage.module'
import { NewsletterModule } from './newsletter/newsletter.module'
import { SiteConfigModule } from './site-config/site-config.module'
import { SizeGuideModule }   from './size-guide/size-guide.module'
import { TempOrderModule }  from './temp-order/temp-order.module'
import { CartModule }       from './cart/cart.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    SearchModule,
    OrdersModule,
    WishlistModule,
    MediaModule,
    JobsModule,
    PaymentModule,
    AdminModule,
    HomepageModule,
    NewsletterModule,
    SiteConfigModule,
    SizeGuideModule,
    TempOrderModule,
    CartModule,
  ],
})
export class AppModule {}