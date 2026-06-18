import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { InvoiceService } from './invoice.service';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [ConfigModule, DatabaseModule],
  providers: [EmailService, InvoiceService],
  exports: [EmailService, InvoiceService],
})
export class EmailModule {}
