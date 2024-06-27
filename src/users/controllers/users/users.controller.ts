import {
    Body,
    Controller,
    Post,
    UsePipes,
    ValidationPipe,
    Request,
    UseGuards,
    Get
    } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/users.dtos';
import { UsersService } from 'src/users/services/users/users.service';
import { LocalAuthGuard } from 'src/users/services/users/local-auth.guard';
import { Public } from 'src/users/services/users/public.decorator';

@Controller('users')
export class UsersController {
    constructor(private readonly userService: UsersService) {}
  
    /*
    @Get('id/:id')
    findUsersById(@Param('id', ParseIntPipe) id: number) {
      return this.userService.findUsersById(id);
    }*/
    
    @Public()
    @Post('create')
    @UsePipes(ValidationPipe)
    async createUser(@Body() createUserDto: CreateUserDto) {
      try {
        return this.userService.createUser(createUserDto);
      } catch(e) {
        throw e;
      }
    }

    @Public()
    @UseGuards(LocalAuthGuard)
    @Post('login')
    async login(@Request() req) {
      return this.userService.login(req.user);
    }

    @Get('profile')
    getProfile(@Request() req) {
      return req.user.username;
    }

    @Get('isAdmin')
    getIsAdmin(@Request() req) {
      return req.user.admin;
    }
}
