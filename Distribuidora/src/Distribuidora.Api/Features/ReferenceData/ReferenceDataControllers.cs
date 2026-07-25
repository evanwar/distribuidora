using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.ReferenceData;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.ReferenceData;

[ApiController, Route("api/v1/categories"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class CategoriesController(ReferenceDataService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Catalogs.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<NamedCatalogResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<NamedCatalogResponse>>.Ok(
            service.GetCategories().Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Catalogs.Create)]
    public async Task<ActionResult<ApiResponse<NamedCatalogResponse>>> Create(
        [FromBody] NamedCatalogRequest request, CancellationToken cancellationToken)
    {
        var category = await service.SaveCategoryAsync(
            null, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Created($"/api/v1/categories/{category.Id}",
            ApiResponse<NamedCatalogResponse>.Ok(HttpResponseMapper.Map(category), HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Catalogs.Edit)]
    public async Task<ActionResult<ApiResponse<NamedCatalogResponse>>> Update(
        [FromRoute] Guid id, [FromBody] NamedCatalogRequest request, CancellationToken cancellationToken)
    {
        var category = await service.SaveCategoryAsync(
            id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Ok(ApiResponse<NamedCatalogResponse>.Ok(HttpResponseMapper.Map(category), HttpContext.TraceIdentifier));
    }
}

[ApiController, Route("api/v1/brands"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class BrandsController(ReferenceDataService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Catalogs.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<NamedCatalogResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<NamedCatalogResponse>>.Ok(
            service.GetBrands().Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Catalogs.Create)]
    public async Task<ActionResult<ApiResponse<NamedCatalogResponse>>> Create(
        [FromBody] NamedCatalogRequest request, CancellationToken cancellationToken)
    {
        var brand = await service.SaveBrandAsync(
            null, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Created($"/api/v1/brands/{brand.Id}",
            ApiResponse<NamedCatalogResponse>.Ok(HttpResponseMapper.Map(brand), HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Catalogs.Edit)]
    public async Task<ActionResult<ApiResponse<NamedCatalogResponse>>> Update(
        [FromRoute] Guid id, [FromBody] NamedCatalogRequest request, CancellationToken cancellationToken)
    {
        var brand = await service.SaveBrandAsync(
            id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Ok(ApiResponse<NamedCatalogResponse>.Ok(HttpResponseMapper.Map(brand), HttpContext.TraceIdentifier));
    }
}

[ApiController, Route("api/v1/units"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class UnitsController(ReferenceDataService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Catalogs.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<UnitResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<UnitResponse>>.Ok(
            service.GetUnits().Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Catalogs.Create)]
    public async Task<ActionResult<ApiResponse<UnitResponse>>> Create(
        [FromBody] UnitRequest request, CancellationToken cancellationToken)
    {
        var unit = await service.SaveUnitAsync(
            null, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Created($"/api/v1/units/{unit.Id}",
            ApiResponse<UnitResponse>.Ok(HttpResponseMapper.Map(unit), HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Catalogs.Edit)]
    public async Task<ActionResult<ApiResponse<UnitResponse>>> Update(
        [FromRoute] Guid id, [FromBody] UnitRequest request, CancellationToken cancellationToken)
    {
        var unit = await service.SaveUnitAsync(
            id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Ok(ApiResponse<UnitResponse>.Ok(HttpResponseMapper.Map(unit), HttpContext.TraceIdentifier));
    }
}
