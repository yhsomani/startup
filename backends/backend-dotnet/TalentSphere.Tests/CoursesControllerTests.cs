using Xunit;
using Moq;
using Microsoft.AspNetCore.Mvc;
using TalentSphere.API.Controllers;
using TalentSphere.API.Services;
using TalentSphere.API.DTOs;
using System.Threading.Tasks;
using System;
using System.Collections.Generic;

namespace TalentSphere.Tests
{
    public class CoursesControllerTests
    {
        private readonly Mock<CourseService> _mockService;
        private readonly CoursesController _controller;

        public CoursesControllerTests()
        {
            // Note: CourseService methods must be virtual for Moq to override them
            // We pass nulls for dependencies since we are partial mocking or strictly ensuring mocked methods are called
            _mockService = new Mock<CourseService>(null!, null!); 
            _controller = new CoursesController(_mockService.Object);
        }

        [Fact]
        public async Task UpdateCourse_ReturnsNoContent_WhenSuccessful()
        {
            // Arrange
            var courseId = Guid.NewGuid();
            var request = new UpdateCourseRequest { Title = "Updated Title" };

            _mockService.Setup(s => s.UpdateCourseAsync(courseId, request))
                        .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.UpdateCourse(courseId, request);

            // Assert
            Assert.IsType<NoContentResult>(result);
            _mockService.Verify(s => s.UpdateCourseAsync(courseId, request), Times.Once);
        }

        [Fact]
        public async Task DeleteCourse_ReturnsNoContent_WhenSuccessful()
        {
            // Arrange
            var courseId = Guid.NewGuid();

            _mockService.Setup(s => s.DeleteCourseAsync(courseId))
                        .Returns(Task.CompletedTask);

            // Act
            var result = await _controller.DeleteCourse(courseId);

            // Assert
            Assert.IsType<NoContentResult>(result);
            _mockService.Verify(s => s.DeleteCourseAsync(courseId), Times.Once);
        }
    }
}
