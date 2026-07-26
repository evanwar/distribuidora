using System.Net.Mime;
using Distribuidora.Api.Auth;
using Distribuidora.Api.Common;
using Distribuidora.Application.Abstractions;
using Distribuidora.Application.Features.Administration;
using Distribuidora.Contracts.Common;
using Distribuidora.Contracts.Requests;
using Distribuidora.Contracts.Responses;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Distribuidora.Api.Features.Administration;

[ApiController, Route("api/v1/admin/settings"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class SettingsController(AdministrationService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Administration.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<SystemSettingResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<SystemSettingResponse>>.Ok(service.GetSettings().Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpPut("{key}"), Authorize(Policy = Permissions.Administration.Configure)]
    public async Task<ActionResult<ApiResponse<SystemSettingResponse>>> Update([FromRoute] string key, [FromBody] UpdateSettingRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<SystemSettingResponse>.Ok(HttpResponseMapper.Map(await service.UpdateSettingAsync(key, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken)), HttpContext.TraceIdentifier));
}

[ApiController, Route("api/v1/admin/folio-sequences"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class FolioSequencesController(AdministrationService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet, Authorize(Policy = Permissions.Administration.View)]
    public ActionResult<ApiResponse<IReadOnlyCollection<FolioSequenceResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<FolioSequenceResponse>>.Ok(service.GetFolioSequences().Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Administration.ManageFolios)]
    public async Task<ActionResult<ApiResponse<FolioSequenceResponse>>> Create([FromBody] FolioSequenceRequest request, CancellationToken cancellationToken)
    {
        var result = await service.SaveFolioAsync(null, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Created($"/api/v1/admin/folio-sequences/{result.Id}", ApiResponse<FolioSequenceResponse>.Ok(HttpResponseMapper.Map(result), HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Administration.ManageFolios)]
    public async Task<ActionResult<ApiResponse<FolioSequenceResponse>>> Update([FromRoute] Guid id, [FromBody] FolioSequenceRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<FolioSequenceResponse>.Ok(HttpResponseMapper.Map(await service.SaveFolioAsync(id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken)), HttpContext.TraceIdentifier));
}

[ApiController, Route("api/v1/admin/payment-methods"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class PaymentMethodsController(AdministrationService service, ICurrentUser currentUser) : ControllerBase
{
    // El catálogo activo es necesario en venta y cobranza; su mantenimiento
    // continúa protegido por los permisos administrativos de POST/PUT.
    [HttpGet]
    public ActionResult<ApiResponse<IReadOnlyCollection<PaymentMethodResponse>>> GetAll() =>
        Ok(ApiResponse<IReadOnlyCollection<PaymentMethodResponse>>.Ok(service.GetPaymentMethods().Select(HttpResponseMapper.Map).ToArray(), HttpContext.TraceIdentifier));

    [HttpPost, Authorize(Policy = Permissions.Administration.ManagePaymentMethods)]
    public async Task<ActionResult<ApiResponse<PaymentMethodResponse>>> Create([FromBody] PaymentMethodRequest request, CancellationToken cancellationToken)
    {
        var result = await service.SavePaymentMethodAsync(null, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken);
        return Created($"/api/v1/admin/payment-methods/{result.Id}", ApiResponse<PaymentMethodResponse>.Ok(HttpResponseMapper.Map(result), HttpContext.TraceIdentifier));
    }

    [HttpPut("{id:guid}"), Authorize(Policy = Permissions.Administration.ManagePaymentMethods)]
    public async Task<ActionResult<ApiResponse<PaymentMethodResponse>>> Update([FromRoute] Guid id, [FromBody] PaymentMethodRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<PaymentMethodResponse>.Ok(HttpResponseMapper.Map(await service.SavePaymentMethodAsync(id, request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken)), HttpContext.TraceIdentifier));
}

[ApiController, Route("api/v1/admin/policies"), Authorize, Produces(MediaTypeNames.Application.Json)]
public sealed class PoliciesController(AdministrationService service, ICurrentUser currentUser) : ControllerBase
{
    [HttpGet("credit"), Authorize(Policy = Permissions.Administration.View)]
    public ActionResult<ApiResponse<CreditPolicyResponse>> GetCredit() =>
        Ok(ApiResponse<CreditPolicyResponse>.Ok(HttpResponseMapper.Map(service.GetCreditPolicy()), HttpContext.TraceIdentifier));

    [HttpPut("credit"), Authorize(Policy = Permissions.Administration.Configure)]
    public async Task<ActionResult<ApiResponse<CreditPolicyResponse>>> UpdateCredit([FromBody] CreditPolicyRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<CreditPolicyResponse>.Ok(HttpResponseMapper.Map(await service.UpdateCreditPolicyAsync(request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken)), HttpContext.TraceIdentifier));

    [HttpGet("inventory"), Authorize(Policy = Permissions.Administration.View)]
    public ActionResult<ApiResponse<InventoryPolicyResponse>> GetInventory() =>
        Ok(ApiResponse<InventoryPolicyResponse>.Ok(HttpResponseMapper.Map(service.GetInventoryPolicy()), HttpContext.TraceIdentifier));

    [HttpPut("inventory"), Authorize(Policy = Permissions.Administration.Configure)]
    public async Task<ActionResult<ApiResponse<InventoryPolicyResponse>>> UpdateInventory([FromBody] InventoryPolicyRequest request, CancellationToken cancellationToken) =>
        Ok(ApiResponse<InventoryPolicyResponse>.Ok(HttpResponseMapper.Map(await service.UpdateInventoryPolicyAsync(request, currentUser.Id, HttpContext.TraceIdentifier, cancellationToken)), HttpContext.TraceIdentifier));
}
