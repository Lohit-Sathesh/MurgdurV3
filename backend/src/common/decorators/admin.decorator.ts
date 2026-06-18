import { Injectable } from '@nestjs/common';
import { SetMetadata } from '@nestjs/common';

export const ADMIN_KEY = 'admin-only';
export const AdminOnly = () => SetMetadata(ADMIN_KEY, true);
